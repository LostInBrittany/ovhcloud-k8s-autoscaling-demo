/*
@license MIT
Copyright (c) 2019-2020 Horacio "LostInBrittany" Gonzalez

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
import { html, css, LitElement } from 'lit-element';
import { styleMap } from 'lit-html/directives/style-map';
import { styles as baseStyles } from './style.js';


export class K8sInvadersLifemeter extends LitElement {
    static get properties() {
      return {
        current: {
          type: Number,
        },
        max: {
          type: Number,
        },
        min: {
            type: Number,
        },
      };
    }



    constructor() {
        super();
        this.min = 0;
        this.max = 100;
        this.current = 50;
    }

    getLifemeterWidth() {
        if (this.min > this.max) {
            return '0';
        }
        if (this.current >= this.max) {
            return `100%`;
        }
        if (this.current <= this.min) {
            return '0';
        }
        return `${100*(this.current-this.min)/(this.max-this.min)}%`
    }

    getLifemeterColor() {
        if (this.min > this.max) {
            return 'black';
        }
        if (this.current >= this.max) {
            return `black`;
        }
        if (this.current <= this.min) {
            return 'green';
        }
        let score = 100*(this.current-this.min)/(this.max-this.min);

        if (score < 60) {
            return 'green';
        }
        if (score < 80) {
            return 'orange';
        }
        return 'red';
    }

    render() {
        return html`
            <div class="lifemeter">
                <div 
                    class="life" 
                    style="${styleMap({ 
                        width:  this.getLifemeterWidth(),
                        'background-color': this.getLifemeterColor(),
                    })}"></div>
            </div>
        `;   
    }

    static get styles() {
        return [ 
            css`
                :host {
                    display: block;
                    width: 100%;
                    min-width: 100px;
                    margin: 16px;
                }
                .lifemeter {
                    width: 100%;
                    height: 30px;
                    border: solid 2px #000E9C;
                }
                .life {
                    width: 0%;
                    height: 100%;

                }
            `,
        ];
    }
}

customElements.define('k8s-invaders-lifemeter', K8sInvadersLifemeter);