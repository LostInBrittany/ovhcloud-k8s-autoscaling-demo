![OVHcloud Ecosystem Experience](./img/ecosystemexperience.png)

# OVHcloud Kubernetes auto-scaling demo

In this repository you will find the documentation and the code accompanying the *Auto-scaling and load-testing your web application on Kubernetes* tech master-class at the [OVHcloud Ecosystem Experience 2020](https://ecosystemexperience.ovhcloud.com/). 



---

## Pods

In the `pods` folder you will find the code of the two kinds of pods we are deploying for these demo. Both pods are very naive prime numbers calculators, but with a very different memory-consumption profile:

- The *Prime Numbers* pods (`pods/prime_numbers`) simply calculates prime numbers in the most performance ineffective way: by dividing every positive integer number by all the lower positive integers. It's a CPU intensive operation, but it use a minimal amount of memory.  

- The *Memory Grabber* pods (`pods/memory_grabber`) calculates prime numbers with a slightly less naive algorithm, more efficient in CPU terms but with a linear growing memory consummation, as it stores every prime number found in an array.

Both are coded in a similar way, as [NodeJS](https://nodejs.org/) programs. The main script, on `index.js`, is a [Express server](https://expressjs.com/) that launches a [worker thread](https://nodejs.org/api/worker_threads.html) were the prime number calculation is done outside the even loop.

We pack both programs into two Docker images, using the [official Node Docker image](https://hub.docker.com/_/node) as a base, as described in each `Dockerfile`. 


We have published the two images [on my Dockerhub](https://hub.docker.com/u/lostinbrittany):

- *Prime Numbers*: `https://hub.docker.com/r/lostinbrittany/ovhcloud-k8s-autoscaling-demo_prime-numbers`

- *Memory Grabber*: `https://hub.docker.com/r/lostinbrittany/ovhcloud-k8s-autoscaling-demo_memory-grabber`


---

## The auto-scaler

The auto-scaler code is in the `auto-scaler` folder. As for the prime numbers calculators, the autoscaler is a [NodeJS](https://nodejs.org/) program built around [Express server](https://expressjs.com/). 

The auto-scaler uses heavily the Kubernetes API. We could have done it using the [official NodeJS Kubernetes API client](https://github.com/kubernetes-client/javascript), but in order to make the auto-scaler as generic as possible, we simply call directly the REST API without using the library. 

The code is more complex that for the prime numbers calculators, so let's take some time to analyse it.


### Explaining some functions


#### `getNodesMetrics()`

This function uses the [Kubernetes standard API](https://kubernetes.io/docs/reference/kubernetes-api/) and the [Kubernetes Metrics API](https://kubernetes.io/docs/tasks/debug-application-cluster/resource-metrics-pipeline/#the-metrics-api) to calculate the 
real CPU and memory consumptions on every node and compares it to the maximum allocatable CPU and memory.

Counterintuitively, it isn't a good metric to base the auto-scaler on, as it isn't used by the Kubernetes scheduler (that uses the [resources requests and limits](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/) instead of instantaneous consumption).


#### `getPods()`

This function get all the pods running in a given namespace, and computes its [resources (requests and limits)](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/).


#### `getPodsFromAllNamespaces()`

This function lists the [namespaces](https://kubernetes.io/docs/concepts/overview/working-with-objects/namespaces/) in the Kubernetes cluster and then calls `getPods()` on all of them, to get all the pods running in the cluster and their resources.


#### `getLoadByNode()`

The `getPodsByNode()` function first calls the Kubernetes API to get the allocatable memory and CPU capacity of every node, and then calls `getPodsFromAllNamespaces()` to get add the pods running on the cluster and, by looking at the nodes where they run, compute the total resources (requests and limits) allocated for every node.


#### `getNodePools()`

This function calls the [OVHcloud NodePool API](https://docs.ovh.com/gb/en/kubernetes/managing-nodes-with-api/) to get the relevant information on all the node pools on your cluster


#### `getLoadByNodePool()`

The `getLoadByNodePool()` function uses `getNodePools()` and `getLoadByNode()` to compute for every node pool its total allocated resources (requests and limits) and its allocatable capability.


#### `getDeployments()` and `getDeployment(name)`

These functions call the API to get information on Deployments. They are used by the Kubernetes Invaders webapp to get th


#### `increaseDeployment(name)` and `decreaseDeployment(name)`

`increaseDeployment(name)` and `decreaseDeployment(name)` are used by the *Kubernetes Invaders* webapp to increase or decrease the number of *Prime Numbers* or *Memory Grabber* pods.  They do it by calling the Kubernetes API and patching the corresponding Deployment object.


#### `increaseNodePool(name)` and `decreaseNodePool(name)`

These functions call [OVHcloud NodePool API](https://docs.ovh.com/gb/en/kubernetes/managing-nodes-with-api/) to increase or decrease the size of a node pool.


#### `autoscaling()`

This is the heart of the auto-scaler, and it's quite simple: it calls `getLoadByNodePool()` to get the load of every NodePool and then it makes the decision of upscaling or downscaling them.

As explained in the talk, the decision algorithm can be as simple or  as complicated as you need. We have kept it simple here. For the upscaling, we look at the global load in the node pool, and to the individual load in each node, for both CPU and memory. If the global load (in either CPU or memory) if higher than 80%, or if all the nodes have at least one of the loads (either CPU or memory) over 80% (meaning that all the nodes are under pressure), the auto-scaler will ask to add a node to the node pool. For the downscaling we look if the global load is in under 50% in both CPU and memory, and we keep a minimum of three active nodes in the node pool at every moment.


#### `/prime-numbers` and `/memory-grabber` REST entry points

There are three REST entry points for *Prime Numbers*, and three for *Memory Grabber*:

- `app.get('/prime-numbers', ...)`: gets all the information on running *Prime Numbers* pods
- `app.put('/prime-numbers', ...)`: adds a new *Prime Numbers* pod
- `app.delete('/prime-numbers', ...)`: deletes a *Prime Numbers* pod

- `app.get('/memory-grabber', ...)`: gets all the information on running *Memory Grabber* pods
- `app.put('/memory-grabber', ...)`: adds a new *Memory Grabber* pod
- `app.delete('/memory-grabber', ...)`: deletes a *Memory Grabber* pod


#### `/nodepool/:name` REST entrypoint

These 3 entrypoints allows to deal with the node pools directly (for easy testing):

- `app.get('/nodepool/:name', ...)`: gets all the information on a  node pool
- `app.put('/nodepool/:name', ...)`: adds a new node to the node pool
- `app.delete('/nodepool/:name', ...)`: removes a node from the node pool


### `Dockerfile` and Docker image

As for *Prime Numbers* and *Memory Grabber*, we have packed the auto-scaler into a Docker images, using the [official Node Docker image](https://hub.docker.com/_/node) as a base, as described in the `Dockerfile`. The image is available on [on my Dockerhub](https://hub.docker.com/u/lostinbrittany):


---

## The Kubernetes objects

In the `k8s` folder, you will find the YAML files for the various Kubernetes objects that we use in the demo:

### `rbac.yaml`

Here you have the Service Account, the Cluster Role and the Cluster Role Binding needed for the [RBAC authentication](https://kubernetes.io/docs/reference/access-authn-authz/). The auto-scaler pod is going to use this Service Account to be able to call the Kubernetes API.

In the Service Account `rules` section, we detail the API resources that the auto-scaler need to be able to manipulate in order to do its work. 


### `prime_numbers.yaml` and `memory_grabber.yaml` 

These are the manifests for the Deployments of the two families of pods, *Prime Numbers* and *Memory Grabber*. Both are rather similar, the main difference is the resources asked for:

- *Prime Numbers*

  ```
        resources:
          limits:
            cpu: 300m
            memory: 30Mi
          requests:
            cpu: 150m
            memory: 15Mi  
  ```

- *Memory Grabber*

  ```
        resources:
          limits:
            cpu: 200m
            memory: 1500Mi
          requests:
            cpu: 100m
            memory: 1000Mi  
  ```

