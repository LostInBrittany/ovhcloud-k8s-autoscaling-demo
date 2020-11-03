/*
@license MIT
Copyright (c) 2019-2020 Horacio "LostInBrittany" Gonzalez

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
import { html, css, LitElement } from 'lit-element';
import { styles as baseStyles } from './style.js';
import './k8s-invaders-lifemeter';
import './k8s-invaders-tooltip';
import './k8s-invaders-pod-details';
import './k8s-invaders-box';
import './k8s-invaders-tools';
import { fetchWithTimeout } from './k8s-invaders-tools';

export class K8sInvaders extends LitElement {
  static get properties() {
    return {
      backend: {
        type: String,
      },
      _nodePools: {
        type: Array,
      },
      _deployments: {
        type: Array,
      },
    };
  }

  constructor() {
    super();
    this._nodePools = [];
  }

  connectedCallback() {
    super.connectedCallback();
    this.getNodePools();
    this.getDeployments();
  }

  async getDeployments() {
    setInterval(async () => {
      try {
        let response = await fetchWithTimeout(10000, `${this.backend}/deployments`);
        let responseJSON = await response.json();
        console.log('Deployments', responseJSON);
        this._deployments = responseJSON;
      } catch(err) {
        console.error(err);
      } 
    }, 5000);
  }

  async getNodePools() {
    setInterval(async () => {
      try {
        let response = await fetchWithTimeout(10000, `${this.backend}/load`,);
        let responseJSON = await response.json();
        console.log('NodePools', responseJSON);
        this._nodePools = responseJSON;
      } catch(err) {
        console.error(err);
      }
    }, 5000);
  }

  async addPrimeNumberPod() {
    try {
      let response = await fetchWithTimeout(10000, `${this.backend}/prime-numbers`, {
        method: 'PUT',
      });
      let responseJSON = await response.json();
      console.log('addPrimeNumberPod', responseJSON);
    } catch(err) {
      console.error(err);
    } 
  }

  async deletePrimeNumberPod() {
    try {
      let response = await fetchWithTimeout(10000, `${this.backend}/prime-numbers`, {
        method: 'DELETE',
      });
      let responseJSON = await response.json();
      console.log('deletePrimeNumberPod', responseJSON);
    } catch(err) {
      console.error(err);
    } 
  }

  async addMemoryGrabberPod() {
    try {
      let response = await fetchWithTimeout(10000, `${this.backend}/memory-grabber`, {
        method: 'PUT',
      });
      let responseJSON = await response.json();
      console.log('addMemoryGrabberPod', responseJSON);
    } catch(err) {
      console.error(err);
    } 
  }

  async deleteMemoryGrabberPod() {
    try {
      let response = await fetchWithTimeout(10000, `${this.backend}/memory-grabber`, {
        method: 'DELETE',
      });
      let responseJSON = await response.json();
      console.log('deleteMemoryGrabberPod', responseJSON);
    } catch(err) {
      console.error(err);
    } 
  }


  renderPod(pod) {    
    if (pod.name.startsWith('prime-numbers')) {
      return html`
        <k8s-invaders-tooltip 
            .heading="${html`
              <div><i class="icon-space-invader_1"  style="color: green;" aria-hidden="true"></i></div> 
              <div style="color: green;">Prime Numbers</div>
            `}" 
            tipwidth="200"
            .message="${
              html`
                <k8s-invaders-pod-details .pod="${pod}"></k8s-invaders-pod-details>
              `
            }">
          <div class="pod-icon"> <i class="icon-space-invader_1"  style="color: green;" aria-label="Prime Numbers pod"></i></div>
        </k8s-invaders-tooltip>
      `;   
    }
    if (pod.name.startsWith('memory-grabber')) {
      return html`
        <k8s-invaders-tooltip 
            .heading="${html`
              <div><i class="icon-space-invader_2"  style="color: purple;" aria-hidden="true"></i></div> 
              <div style="color: purple;">Memory Grabber</div>
            `}" 
            tipwidth="200"
            .message="${
              html`
                <k8s-invaders-pod-details .pod="${pod}"></k8s-invaders-pod-details>
              `
            }">
          <div class="pod-icon"> <i class="icon-space-invader_2"  style="color: purple;" aria-label="Memory Grabber pod"></i></div>
        </k8s-invaders-tooltip>
      `;    
    }
    return html`
    <k8s-invaders-tooltip 
        .heading="${html`
          <div><i class="icon-space-invader_3"  style="color: orange;" aria-hidden="true"></i></div> 
          <div style="color: orange;">Other</div>
        `}" 
        tipwidth="200"
        .message="${
          html`
            <k8s-invaders-pod-details .pod="${pod}"></k8s-invaders-pod-details>
          `
        }">
      <div class="pod-icon"> <i class="icon-space-invader_3"  style="color: orange;" aria-label="Other pod"></i></div>
    </k8s-invaders-tooltip>
  `;  
  }


  renderNode(node) {
    return html`    
    <k8s-invaders-box class="node">
      <div slot="label">Node <i class="icon-space-invader_0-1"  aria-hidden="true"></i></div>
      <div class="content vertical">
        <div class="content">
          ${node.pods.map((pod) => this.renderPod(pod))}
        </div>
        <div class="node-name">${node.name}</div>
      </div>
    </k8s-invaders-box>
    `;
  }

  renderNodeIcons(nodepool) {
    let available = Math.min(nodepool.status.availableNodes,nodepool.spec.desiredNodes);
    let increasing = Math.max(0, nodepool.spec.desiredNodes-nodepool.status.availableNodes);
    let decreasing = Math.max(0,  nodepool.status.availableNodes - nodepool.spec.desiredNodes);

    return html`
      ${[...Array(available)].map(() => 
        html`<div class="node-icon" aria-label="Node"><i class="icon-space-invader_0-1"  aria-hidden="true"></i></div>` )}
      ${[...Array(increasing)].map(() => 
        html`<div class="node-icon increasing" aria-label="Node"><i class="icon-space-invader_0-1"  aria-hidden="true"></i></div>`)}
      ${[...Array(decreasing)].map(() => 
        html`<div class="node-icon decreasing" aria-label="Node"><i class="icon-space-invader_0-1"  aria-hidden="true"></i></div>`)}
    `;
  }

  render() {
    return html`

      <h1>K8s <i class="icon-k8s-empty" aria-hidden="true"></i> Invaders</h1>

      ${this._nodePools.map((nodepool) => html`

        <k8s-invaders-box class="nodepool">
          <div slot="label">NodePool ${nodepool.name}</div>
          <div class="content">

            <div class="global">

              <k8s-invaders-box class="nodes">
                <div slot="label">Nodes</div>    
                <div class="content">
                  ${this.renderNodeIcons(nodepool)}
                </div>
              </k8s-invaders-box>
        
              <k8s-invaders-box class="load">
                <div slot="label">Load</div>    
                <div class="content vertical">                    
                  <div class="lifemeter">
                    <div class="label">CPU</div>
                    <k8s-invaders-lifemeter 
                        max="${nodepool.allocatable.cpu}" 
                        current="${nodepool.requests.cpu}"></k8s-invaders-lifemeter>
                    <div class="score">
                      ${nodepool.requests.cpu}m / ${nodepool.allocatable.cpu}m 
                      (${(100*nodepool.requests.cpu/nodepool.allocatable.cpu).toFixed(2)}%)
                    </div>
                  </div>
                  <div class="lifemeter">
                    <div class="label">Memory</div>
                    <k8s-invaders-lifemeter 
                        max="${nodepool.allocatable.memory}" 
                        current="${nodepool.requests.memory}"></k8s-invaders-lifemeter>
                    <div class="score">
                      ${nodepool.requests.memory}Mi / ${nodepool.allocatable.memory}Mi
                      (${(100*nodepool.requests.memory/nodepool.allocatable.memory).toFixed(2)}%)
                    </div>
                  </div>
                </div>
              </k8s-invaders-box>

              <k8s-invaders-box class="pod-management">
                <div slot="label">Pods Management</div>    
                <div class="content vertical">   
                  <div class="content vertical">
                    <div class="replicas prime-numbers">
                      <div class="icon"> 
                        <i class="icon-space-invader_1"aria-hidden="true"></i> 
                      </div>
                      <div class="values"> 
                        <div class="label" >Prime Numbers pods</div>
                        <div>
                          Scheduled: ${
                          this._deployments
                            .find((item) => item.metadata.name == 'prime-numbers')
                            .status.replicas
                          }
                        </div>
                        <div>
                          Ready: ${
                          this._deployments
                            .find((item) => item.metadata.name == 'prime-numbers')
                            .status.availableReplicas
                          }
                        </div>
                      </div>    
                    </div>

                    <div class="replicas memory-grabber">
                      <div class="icon"> 
                        <i class="icon-space-invader_2" aria-hidden="true"></i> 
                      </div>
                      <div class="values"> 
                        <div class="label">Memory Grabber pods</div>
                        <div>
                          Scheduled: ${
                          this._deployments
                            .find((item) => item.metadata.name == 'memory-grabber')
                            .status.replicas
                          }
                        </div>
                        <div>
                          Ready: ${
                          this._deployments
                            .find((item) => item.metadata.name == 'memory-grabber')
                            .status.availableReplicas
                          }
                        </div>
                      </div>  
                    </div>    
                  </div>

                  <div class="content">
                    <div class="content vertical">
                      <div class="button-container add">
                        <button aria-label="Add Prime Number pod" @click="${() => this.addPrimeNumberPod()}">
                          <i class="icon-space-invader_1" aria-hidden="true"></i> +1
                        </button>
                      </div>
                      <div class="button-container delete">
                        <button aria-label="Delete Prime Number pod" @click="${() => this.deletePrimeNumberPod()}">
                          <i class="icon-space-invader_1" aria-hidden="true"></i> -1
                        </button>
                      </div>
                    </div>
                    <div class="content vertical">
                      <div class="button-container add">
                        <button aria-label="Add Memory Grabber pod" @click="${() => this.addMemoryGrabberPod()}">
                          <i class="icon-space-invader_2" aria-hidden="true"></i> +1
                        </button>
                      </div>
                      <div class="button-container delete">
                        <button aria-label="Delete Memory Grabber pod" @click="${() => this.deleteMemoryGrabberPod()}">
                          <i class="icon-space-invader_2" aria-hidden="true"></i> -1
                        </button>
                      </div>
                    </div>
                  </div>
                  <div class="same-player-plays-again">Same player plays again</div>
                </div>
              </k8s-invaders-box>
            </div>

            <div class="details">

              <k8s-invaders-box class="pods">
                <div slot="label">Pods</div>    
                <div class="content vertical">               
                  ${nodepool.nodes 
                    ? nodepool.nodes.map((node) => this.renderNode(node) ) 
                    : ''}
                </div>
              </k8s-invaders-box>

            </div>
          </div>
        </k8s-invaders-box>
      `)}
    `;
  }

  static get styles() {
    return [
      baseStyles,
      css`
        .global {
          min-width: min(100%, 400px);
          width: 50%;
        }
        .global > * {
          margin-bottom: 48px;
        }
        .details {
          min-width: min(100%, 400px);
          width: 50%;
        }

        
        k8s-invaders-box .content {
          width: 100%;
          display: flex;
          flex-flow: row wrap;
          align-items: center;
          justify-content: space-evenly;
        }

        k8s-invaders-box .content.vertical {
          width: initial;
          display: flex;
          flex-flow: column nowrap;
          align-items: center;
        }

        k8s-invaders-box.nodepool {
          --k8s-invaders-box-color: red;
          --k8s-invaders-box-background: #ffffff;
          --k8s-invaders-box-label-size: 36px;
        }

        k8s-invaders-box.nodes, 
        k8s-invaders-box.load,
        k8s-invaders-box.pods,
        k8s-invaders-box.pod-management {
          --k8s-invaders-box-color: #000E9C;
          --k8s-invaders-box-background: #ffffff;
          --k8s-invaders-box-label-size: 24px;
        }
    
        k8s-invaders-box.node {
          --k8s-invaders-box-color: sienna;
          --k8s-invaders-box-background: #ffffff;
          --k8s-invaders-box-label-size: 24px;
        }

        @media (max-width: 640px) {
          k8s-invaders-box.nodepool {
            --k8s-invaders-box-label-size: 24px;
          }
          k8s-invaders-box.nodes, k8s-invaders-box.load {
            --k8s-invaders-box-label-size: 18px;
          }
        }

        k8s-invaders-box.nodepool > .content {
          align-items: flex-start;
        }

        k8s-invaders-box.nodes .node-icon {
          font-size: 24px;
          margin: 8px;
        }
        
        k8s-invaders-box.nodes .node-icon.increasing {
          animation: changing-nodepool;
          animation-duration: 0.5s;
          animation-direction: alternate;
          animation-iteration-count: infinite;
          color: mediumseagreen;
        }
        k8s-invaders-box.nodes .node-icon.decreasing {
          animation: changing-nodepool;
          animation-duration: 1s;
          animation-direction: alternate;
          animation-iteration-count: infinite;
          color: firebrick;
        }
        @keyframes changing-nodepool {
          0%   { opacity: 100%; }
          25%  { opacity: 100%; }
          100% { opacity: 0%; }
        }


        k8s-invaders-box.node .content {
          justify-content: flex-start;
        }
        k8s-invaders-box.node .node-name {
          text-align: center;
        }
        
        .replicas {
          font-size: 12px;
          padding: 16px;
          width: 260px;
          display:flex;
          flex-flow: row nowrap; 
          justify-content: space-evenly;
        }
        .replicas .icon {
          font-size: 42px;
          margin-right: 16px;
        }
        .replicas .label {
          font-size: 16px;
        }
        .replicas.prime-numbers .icon,
        .replicas.prime-numbers .label {
          color: green;
        }
        .replicas.memory-grabber .icon,
        .replicas.memory-grabber .label {
          color: purple;
        }

        .button-container {
          padding: 16px;
        }
        .button-container > button {
          background-color: #000e9c;
          border-radius: 5px;
          color: white;
          height: 48px;
          min-width: 120px;
          font-size: 24px;
          font-family: 'Righteous', cursive;
        }
        .button-container.add > button {
          background-color: mediumseagreen;
        }
        .button-container.delete > button {
          background-color: firebrick;
        }

        .pod-icon {
          font-size: 24px;
          margin: 16px;
        }
        .lifemeter {
          width: 80%;
          display: flex;
          flex-flow: column nowrap;
          align-items: center;
        }
        .lifemeter > .label {
          width: 100%;
          text-align: left;
        }
        .lifemeter > k8s-invaders-lifemeter {
          width: 100%;
        }
        .lifemeter > .score {
          width: 100%;
          text-align: right;
        }
        .same-player-plays-again {
          font-size: 24px;
          text-align: center;
          animation: motto1;
          animation-duration: 2.5s;
          animation-direction: alternate;
          animation-iteration-count: infinite;
        }
        @keyframes motto1 {
          0%   { color: #000E9C; }
          20%   { color: purple; }
          40%   { color: red; }
          60%   { color: orange; }
          80%   { color: grey; }
          100%   { color: green; }
        }
      `,
    ];
  }
}

customElements.define('k8s-invaders', K8sInvaders);
