const TOKEN_FILE = process.env.TOKEN;
const CA_CRT = process.env.CA_CRT;
const K8S = process.env.K8S;


const fs = require('fs');

let TOKEN;

fs.readFile(TOKEN_FILE, 'utf8', function (err,data) {
    if (err) {
      return console.log(err);
    }
    TOKEN = data.toString();
});

const util = require('util')
const fetch = require('node-fetch');
const express = require('express');
var cors = require('cors')
const { response } = require('express');
const { exit } = require('process');
let app = express();


/* ******************************************************************************** */

function transformCpuUnits(numStr){
    if (numStr.endsWith('m')) {
        return parseInt(numStr.substring(0,numStr.length-1));
    }
    if (numStr.endsWith('n')) {
        return parseInt(numStr.substring(0,numStr.length-1))/1000000.0;
    }
    return parseInt(numStr)*1000;
}

/* ******************************************************************************** */

function transformMemoryUnits(numStr){
    if (numStr.endsWith('Mi')) {
        return parseInt(numStr.substring(0,numStr.length-2));
    }
    if (numStr.endsWith('Ki')) {
        return parseInt(numStr.substring(0,numStr.length-2))/1000.0;
    }
    if (numStr.endsWith('Gi')) {
        return parseInt(numStr.substring(0,numStr.length-2))*1000;
    }
    return parseInt(numStr)/1000.0;
}

/* ******************************************************************************** */

async function getNodesMetrics() {
    let nodes = await fetch(`${K8S}/api/v1/nodes`, {        
        headers: { 'Authorization': `Bearer ${TOKEN}` },
    });
    let nodesJSON = await nodes.json();

    let nodesItems = nodesJSON.items.map((item) => {
        return {
            name: item.metadata.name,
            nodepool: item.metadata.labels?.nodepool,
            allocatable: {
                cpu: transformCpuUnits(item.status.allocatable.cpu),
                memory: transformMemoryUnits(item.status.allocatable.memory),
            },
            capacity: {
                cpu: transformCpuUnits(item.status.capacity.cpu),
                memory: transformMemoryUnits(item.status.capacity.memory),
            }
        }
    });

    let nodeMetrics = await fetch(`${K8S}/apis/metrics.k8s.io/v1beta1/nodes/`, {        
        headers: { 'Authorization': `Bearer ${TOKEN}` },
    });
    let nodeMetricsJSON = await nodeMetrics.json();

    let nodeMetricsItems = nodeMetricsJSON.items.map((item) => {
        return {
            name: item.metadata.name,
            usage: {
                cpu: transformCpuUnits(item.usage.cpu),
                memory: transformMemoryUnits(item.usage.memory),
            },
            allocatable: nodesItems.filter((nodeItem) => 
                nodeItem.name == item.metadata.name)[0].allocatable,
                capacity: nodesItems.filter((nodeItem) => 
                nodeItem.name == item.metadata.name)[0].capacity,
        }
    });
    return nodeMetricsItems;
}


/* ******************************************************************************** */

async function aggregateResourcesInPod(pod) {
    pod.resources = { 
        requests: {
            cpu: 0,
            memory: 0,
        },
        limits: {
            cpu: 0,
            memory: 0,
        }
    }
    for (let j in pod.containers) {
        let container = pod.containers[j];

        if (container?.resources?.requests?.cpu) {
            pod.resources.requests.cpu += transformCpuUnits(container.resources.requests.cpu);
        }
        if (container?.resources?.requests?.memory) {
            pod.resources.requests.memory += transformMemoryUnits(container.resources.requests.memory);
        }
        if (container?.resources?.limits?.cpu) {
            pod.resources.limits.cpu += transformCpuUnits(container.resources.limits.cpu);
        }
        if (container?.resources?.limits?.memory) {
            pod.resources.limits.memory += transformMemoryUnits(container.resources.limits.memory);
        }
    }
}

/* ******************************************************************************** */

async function getPods(namespace) {

    let podsResponse = await fetch(`${K8S}/api/v1/namespaces/${namespace}/pods`, {        
        headers: { 'Authorization': `Bearer ${TOKEN}` },
    });
    let pods = await podsResponse.json();
    pods = pods.items.map((pod) => {
        return {
            name: pod.metadata.name,
            namespace: pod.metadata.namespace,
            node: pod.spec.nodeName,
            containers:pod.spec.containers.map((container) => {
                return {
                    resources: container.resources,
                    ports: container.ports,
                };   
            }),
            hostIP: pod.status.hostIP,
            podIP: pod.status.podIP,
        }
    });
    pods.forEach((pod) => aggregateResourcesInPod(pod));
    
    return pods;
}

/* ******************************************************************************** */

async function getPodsFromAllNamespaces() {
    let namespacesResponse = await fetch(`${K8S}/api/v1/namespaces/`, {        
        headers: { 'Authorization': `Bearer ${TOKEN}` },
    });
    let namespaces = await namespacesResponse.json();
    namespaces = namespaces.items.map((namespace) => namespace.metadata.name);

    let pods = [];

    for (let i in namespaces) {
        pods.push(...await getPods(namespaces[i]));
    }

    return pods;
}

/* ******************************************************************************** */

async function getPodsByNode() {

    
    let nodes = await fetch(`${K8S}/api/v1/nodes`, {        
        headers: { 'Authorization': `Bearer ${TOKEN}` },
    });
    let nodesJSON = await nodes.json();

    let podsByNode = {};

    nodesJSON.items.forEach((item) => { 
        podsByNode[item.metadata.name] = { 
            node: item.metadata.name, 
            nodepool: item.metadata.labels?.nodepool,
            pods: [] 
        }; });
   
    let pods = await getPodsFromAllNamespaces();

    for (let i in pods) {
        let pod = pods[i];
        podsByNode[pod.node].pods.push(pod);
    }
    
    return Object.values(podsByNode);

}

/* ******************************************************************************** */


async function getLoadByNode() {
     
    let nodes = await fetch(`${K8S}/api/v1/nodes`, {        
        headers: { 'Authorization': `Bearer ${TOKEN}` },
    });
    let nodesJSON = await nodes.json();

    let loadByNode = {};

    nodesJSON.items.forEach((item) => { 
        loadByNode[item.metadata.name] = { 
            name: item.metadata.name,               
            nodepool: item.metadata.labels?.nodepool,          
            allocatable: {
                cpu: transformCpuUnits(item.status.allocatable.cpu),
                memory: transformMemoryUnits(item.status.allocatable.memory),
            },
            capacity: {
                cpu: transformCpuUnits(item.status.capacity.cpu),
                memory: transformMemoryUnits(item.status.capacity.memory),
            },
            requests:  { cpu:0, memory:0 },
            limits: { cpu:0, memory:0 },
            pods: [],
        }; 
    });   

    let pods = await getPodsFromAllNamespaces();

    for (let i in pods) {
        let pod = pods[i];

        if (loadByNode[pod.node]) {
            loadByNode[pod.node].pods.push(pod);
            
            for (let j in pod.containers) {
                let container = pod.containers[j];

                if (container?.resources?.requests?.cpu) {
                    loadByNode[pod.node].requests.cpu += transformCpuUnits(container.resources.requests.cpu);
                }
                if (container?.resources?.requests?.memory) {
                    loadByNode[pod.node].requests.memory += transformMemoryUnits(container.resources.requests.memory);
                }
                if (container?.resources?.limits?.cpu) {
                    loadByNode[pod.node].limits.cpu += transformCpuUnits(container.resources.limits.cpu);
                }
                if (container?.resources?.limits?.memory) {
                    loadByNode[pod.node].limits.memory += transformMemoryUnits(container.resources.limits.memory);
                }
            }
        }
    }
    
    return Object.values(loadByNode);
}


/* ******************************************************************************** */

async function getNodePool(name) {
    let nodePoolResponse = await fetch(`${K8S}/apis/kube.cloud.ovh.com/v1alpha1/nodepools/${name}`, {        
        headers: { 'Authorization': `Bearer ${TOKEN}` },
    });
    let nodePoolJSON = await nodePoolResponse.json();

    // console.log(nodePoolJSON)
    return nodePoolJSON;

}

/* ******************************************************************************** */

async function getNodePools() {
    let nodePoolsResponse = await fetch(`${K8S}/apis/kube.cloud.ovh.com/v1alpha1/nodepools/`, {        
        headers: { 'Authorization': `Bearer ${TOKEN}` },
    });
    let nodePoolsJSON = await nodePoolsResponse.json();

    let nodePools = nodePoolsJSON.items.map((item) => {
        return {
            name: item.metadata.name,
            spec: item.spec,
            status: {
                availableNodes: item.status.availableNodes,
                currentNodes: item.status.currentNodes,
                observedGeneration: item.status.observedGeneration,
                upToDateNodes: item.status.upToDateNodes,
            }
        };
    })
    return nodePools;

}


/* ******************************************************************************** */


async function getLoadByNodePool() {
    let nodePools = await getNodePools();
    let loadByNode = await getLoadByNode();

    for (let i in loadByNode) {
        let node = loadByNode[i];
        nodePool = nodePools.find((nodePool) => nodePool.name == node.nodepool);
        if (!nodePool.nodes) {
            nodePool.nodes = [];
        }
        nodePool.nodes.push(node);
    }


    for (let i in nodePools) {
        let nodePool = nodePools[i];

        nodePool.capacity =  { cpu: 0, memory: 0};
        nodePool.allocatable =  { cpu: 0, memory: 0};    
        nodePool.requests =  { cpu: 0, memory: 0}; 
        nodePool.limits =  { cpu: 0, memory: 0}; 

        for (let j in nodePool.nodes) {
            let node = nodePool.nodes[j];

            nodePool.capacity.cpu += node.capacity.cpu;
            nodePool.capacity.memory += node.capacity.memory;
            nodePool.allocatable.cpu += node.allocatable.cpu;
            nodePool.allocatable.memory += node.allocatable.memory;
            nodePool.requests.cpu += node.requests.cpu;
            nodePool.requests.memory += node.requests.memory;
            nodePool.limits.cpu += node.limits.cpu;
            nodePool.limits.memory += node.limits.memory;
        }
    }

    return nodePools;


}

/* ******************************************************************************** */

async function getDeployments() {

    let deploymentsResponse = await fetch(`${K8S}/apis/apps/v1/namespaces/default/deployments`, {   
        method: "GET",     
        headers: { 'Authorization': `Bearer ${TOKEN}` },
    });
    let deploymentsJSON = await deploymentsResponse.json();
    let deployments = deploymentsJSON.items;
    // console.log(deployments);
    return deployments;
}

/* ******************************************************************************** */

async function getDeployment(name) {

    let deploymentResponse = await fetch(`${K8S}/apis/apps/v1/namespaces/default/deployments/${name}`, {   
        method: "GET",     
        headers: { 'Authorization': `Bearer ${TOKEN}` },
    });
    let deploymentJSON = await deploymentResponse.json();
    // console.log(deploymentJSON);
    return deploymentJSON;
}

/* ******************************************************************************** */

async function increaseDeployment(name)  {

    let currentStateResponse = await fetch(`${K8S}/apis/apps/v1/namespaces/default/deployments/${name}`, {   
        method: "GET",     
        headers: { 'Authorization': `Bearer ${TOKEN}` },
    });
    let currentStateJSON = await currentStateResponse.json();
    let replicas = currentStateJSON.spec.replicas;

    
    let increaseDeploymentResponse = await fetch(`${K8S}/apis/apps/v1/namespaces/default/deployments/${name}`, {   
        method: "PATCH",     
        headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/strategic-merge-patch+json' },
        body: `{"spec":{"replicas": ${replicas+1}}, "status":{"currentNodes": ${replicas+1}}}`
    });
    let increaseDeploymentJSON = await increaseDeploymentResponse.json();  
    increaseDeploymentJSON.log = { old: replicas, sent: replicas+1} 
    return increaseDeploymentJSON;
    
}

/* ******************************************************************************** */

async function decreaseDeployment(name) {

    let currentStateResponse = await fetch(`${K8S}/apis/apps/v1/namespaces/default/deployments/${name}`, {   
        method: "GET",     
        headers: { 'Authorization': `Bearer ${TOKEN}` },
    });
    let currentStateJSON = await currentStateResponse.json();
    let replicas = currentStateJSON.spec.replicas;

    if (replicas <1) {
        return 0
    }
    
    let decreaseDeploymentResponse = await fetch(`${K8S}/apis/apps/v1/namespaces/default/deployments/${name}`, {   
        method: "PATCH",     
        headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/strategic-merge-patch+json' },
        body: `{"spec":{"replicas": ${replicas-1}},"status":{"currentNodes": ${replicas-1}}}`
    });
    let decreaseDeploymentJSON = await decreaseDeploymentResponse.json();      
    return decreaseDeploymentJSON;    
}


/* ******************************************************************************** */

let loadByNodePool;

setInterval(async () => { 
        try {
            loadByNodePool = await getLoadByNodePool();
            autoscaling();
            // console.log(util.inspect(load, {showHidden: false, depth: 4})); 
        } catch(err) {
            console.error(err);
        }
    }, 5000);

let deployments;

setInterval(async () => { 
        try {
            deployments = await getDeployments();
            // console.log(deployments); 
        } catch(err) {
            console.error(err);
        }
    }, 5000);


/* ******************************************************************************** */

async function increaseNodePool(name) {
    let nodePoolResponse = await fetch(`${K8S}/apis/kube.cloud.ovh.com/v1alpha1/nodepools/${name}`, {        
        headers: { 'Authorization': `Bearer ${TOKEN}` },
    });
    let nodePoolJSON = await nodePoolResponse.json();

    if (nodePoolJSON.spec.desiredNodes < nodePoolJSON.spec.maxNodes ) {
        let increaseNodePoolResponse = await fetch(`${K8S}/apis/kube.cloud.ovh.com/v1alpha1/nodepools/${name}`, {   
            method: "PATCH",     
            headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/merge-patch+json' },
            body: `{"spec":{"desiredNodes": ${nodePoolJSON.spec.desiredNodes+1}}}`
        });   
        let increaseNodePoolJSON = await increaseNodePoolResponse.json();
        // console.log(increaseNodePoolJSON)
        return increaseNodePoolJSON;
    }
    return {};
}

/* ******************************************************************************** */

async function decreaseNodePool(name) {
    let nodePoolResponse = await fetch(`${K8S}/apis/kube.cloud.ovh.com/v1alpha1/nodepools/${name}`, {        
        headers: { 'Authorization': `Bearer ${TOKEN}` },
    });
    let nodePoolJSON = await nodePoolResponse.json();

    if (nodePoolJSON.spec.desiredNodes > nodePoolJSON.spec.minNodes ) {
        let decreaseNodePoolResponse = await fetch(`${K8S}/apis/kube.cloud.ovh.com/v1alpha1/nodepools/${name}`, {   
            method: "PATCH",     
            headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/merge-patch+json' },
            body: `{"spec":{"desiredNodes": ${nodePoolJSON.spec.desiredNodes-1}}}`
        });   
        let decreaseNodePoolJSON = await decreaseNodePoolResponse.json();
        // console.log(decreaseNodePoolJSON)
        return decreaseNodePoolJSON;
    }
    return {};
}
    
/* ******************************************************************************** */

function autoscaling() {
    loadByNodePool.forEach((nodepool) => {
        if (nodepool.status.availableNodes != nodepool.spec.desiredNodes) {
            // Already resizing
            console.log('Autoscaling in process',
                {availableNodes: nodepool.status.availableNodes, desiredNodes: nodepool.spec.desiredNodes});
            return;
        }
        let cpu = 100*nodepool.requests.cpu/nodepool.allocatable.cpu;
        let memory = 100*nodepool.requests.memory/nodepool.allocatable.memory;

        let allNodesUnderPression = true;
        let nodeLoad = {}

        nodepool.nodes.forEach((node) => {
            let nodeCpu = 100*node.requests.cpu/node.allocatable.cpu;
            let nodeMemory = 100*node.requests.memory/node.allocatable.memory;
            nodeLoad[node.name] = {nodeCpu, nodeMemory}
            if (nodeCpu < 80  && nodeMemory < 80) {
                allNodesUnderPression = false;
            }
        })

        console.log('Autoscaling Nodepool', { name: nodepool.name, cpu, memory, nodeLoad, allNodesUnderPression});
        if (memory>80 || cpu > 80 || allNodesUnderPression) {
            // Increasing if either CPU or Memory are under pression
            increaseNodePool(nodepool.name);
        }
        if (memory<50 && cpu<50 && nodepool.status.availableNodes > 3) {
            // Decreasing only if both CPU and Memory are low, with a minimum of 3
            decreaseNodePool(nodepool.name);
        }
    })
}

/* ******************************************************************************** */

app.use(cors());

/* ******************************************************************************** */

app.get('/', async (req, res) => {

 
    let nodeMetrics = await getNodesMetrics()
    console.log(nodeMetrics);
    res.json(nodeMetrics);
});

/* ******************************************************************************** */

app.get('/pods', async (req, res) => {

    let pods = await getPodsByNode();
    console.log(util.inspect(pods, {showHidden: false, depth: 5}));
    res.json(pods);
});

/* ******************************************************************************** */

app.put('/prime-numbers', async (req, res) => {

    let deployment =  await increaseDeployment('prime-numbers');
    console.log(deployment);
    res.json(deployment);
});

/* ******************************************************************************** */

app.delete('/prime-numbers', async (req, res) => {

    let deployment =  await decreaseDeployment('prime-numbers');
    console.log(deployment);
    res.json(deployment);
});

/* ******************************************************************************** */

app.get('/prime-numbers', async (req, res) => {
    let deployment = await getDeployment('prime-numbers');
    console.log(deployment);
    res.json(deployment);
});

/* ******************************************************************************** */

app.put('/memory-grabber', async (req, res) => {

    let deployment = await increaseDeployment('memory-grabber');
    console.log(deployment);
    res.json(deployment);
});

/* ******************************************************************************** */

app.delete('/memory-grabber', async (req, res) => {

    let deployment = await  decreaseDeployment('memory-grabber');
    console.log(deployment);
    res.json(deployment);
});

/* ******************************************************************************** */

app.get('/memory-grabber', async (req, res) => {
    let deployment = await getDeployment('memory-grabber');
    console.log(deployment);
    res.json(deployment);
});

/* ******************************************************************************** */

app.put('/nodepool/:name', async (req, res) => {
    let nodepool = await increaseNodePool(req.params.name);
    res.json(nodepool);
 });

/* ******************************************************************************** */

app.delete('/nodepool/:name', async (req, res) => {
    let nodepool = await decreaseNodePool(req.params.name);
    res.json(nodepool);
 });

/* ******************************************************************************** */

app.get('/nodepool/:name', async (req, res) => {
    let nodepool = await getNodePool(req.params.name);
    res.json(nodepool);
 });
 
 /* ******************************************************************************** */

app.get('/deployments', async (req, res) => {
    res.json(deployments);
});

/* ******************************************************************************** */

app.get('/load', async (req, res) => {
    res.json(loadByNodePool);
});

/* ******************************************************************************** */

app.get('/nodepools', async (req, res) => {

    let nodePools = await getNodePools();
    console.log(util.inspect(nodePools, {showHidden: false, depth: 5}));
    res.json(nodePools);
});



let server = app.listen(process.env.PORT || 8080, function () {
    let host = server.address().address;
    let port = server.address().port;
    console.log('Listening at http://%s:%s', host, port);
  });
  