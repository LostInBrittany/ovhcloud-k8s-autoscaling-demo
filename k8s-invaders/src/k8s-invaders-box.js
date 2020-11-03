/*
@license MIT
Copyright (c) 2019-2020 Horacio "LostInBrittany" Gonzalez

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
import { html, css, LitElement } from 'lit-element';
import { styles as baseStyles } from './style.js';

export class K8sInvadersBox extends LitElement {
  static get properties() {
    return {
    };
  }


  render() {
    return html`
      <div class="container">
        <div class="label">
          <slot name="label"></slot>
        </div>
        <div class="content">
          <slot></slot>
        </div>  
      </div>
    `;
  }

  static get styles() {
    return [
      baseStyles,
      css`
        :host {
          display: block;
          color: var(--k8s-invaders-box-color, #000E9C);
          width: 100%;
          min-height: 100px;
          background: var(--k8s-invaders-box-background, #ffffff);
        }
        .container {
          margin: 16px;
          margin-top: calc(16px + 0.5 * var(--k8s-invaders-box-label-size, 24px));
          padding-left: 8px;
          padding-right: 8px;
          padding-top: calc(16px + 0.5 * var(--k8s-invaders-box-label-size, 24px));;
          padding-bottom: 16px;
          width: calc(100% - 2 * 16px - 2 * 8px);
          height: 100%;
          border: solid 2px var(--k8s-invaders-box-color, #000E9C);
          border-radius: 5px;
          position: relative;
          background: var(--k8s-invaders-box-background, #ffffff);
        }
        .label{          
          display: inline-block;
          font-size: var(--k8s-invaders-box-label-size, 24px);
          position: absolute;
          top: calc( -0.8 * var(--k8s-invaders-box-label-size, 24px));
          right: 18px;
          background: var(--k8s-invaders-box-background, #ffffff);
        }
      `,
    ];
  }
}

customElements.define('k8s-invaders-box', K8sInvadersBox);
