import { LitElement, html, css } from 'lit-element';

class K8sInvadersPodDetails extends LitElement {
  static get properties() {
    return {
      pod: { type: Object },
    };
  }

  render() {
    return html`
      <div class="pod">
        <dl>
          <dt>id</dt>
          <dd>${this.pod.name}</dd>
          <dt>CPU</dt>
          <dd>${this.pod.resources.requests.cpu}m</dd>
          <dt>Memory</dt>
          <dd>${this.pod.resources.requests.memory}m</dd>
        </dl>
      </div>
    `;
  }

  static get styles() {
    return css`
      :host {
        font-size: 12px;
        font-family: 'Righteous', cursive;
        color: #000e9c;
      }

      dl {
        display: flex;
        flex-flow: row;
        flex-wrap: wrap;
        width: 100%;      /* set the container width*/
        overflow: visible;
        justify-content: space-between;
      }
      dl dt {
        flex: 0 0 30%;
        text-overflow: ellipsis;
        overflow: hidden;
      }
      dl dd {
        flex:0 0 65%;
        margin-left: auto;
        text-align: left;
        text-overflow: ellipsis;
        overflow: hidden;
        color: red; 
      }
    `;
  }
}

customElements.define('k8s-invaders-pod-details', K8sInvadersPodDetails);
