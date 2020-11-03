import { css } from 'lit-element';

export let styles = css`
  :host {
    color: #000e9c;
    font-family: 'Righteous', cursive;
  }

  h1,
  h2 {
    text-align: center;
    color: red;
  }
  h1 {
    font-size: 42px;
  }
  h2 {
    font-size: 36px;
  }
  
  @media (max-width: 640px) {
    h1 {
      font-size: 36px;
    }
    h2 {
      font-size: 24px;
    }
  }

  [class^='icon-'],
  [class*=' icon-'] {
    /* use !important to prevent issues with browser extensions that change fonts */
    font-family: 'icomoon' !important;
    speak: never;
    font-style: normal;
    font-weight: normal;
    font-variant: normal;
    text-transform: none;
    line-height: 1;

    /* Better Font Rendering =========== */
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  .icon-k8s-empty:before {
    content: '\\e900';
  }
  .icon-space-invader_1-1:before {
    content: '\\e901';
  }
  .icon-space-invader_1-2:before {
    content: '\\e902';
  }
  .icon-space-invader_2-1:before {
    content: '\\e903';
  }
  .icon-space-invader_2-2:before {
    content: '\\e904';
  }
  .icon-space-invader_3-1:before {
    content: '\\e905';
  }
  .icon-space-invader_3-2:before {
    content: '\\e906';
  }
  .icon-space-invader_0-1:before {
    content: '\\e907';
  }

  .icon-space-invader_1:before {
    content: '\\e901';
    transition: content 1s linear;
  }
  .icon-space-invader_1:hover:before {
    content: '\\e902';
    transition: content 1s linear;
  }

  .icon-space-invader_2:before {
    content: '\\e903';
    transition: content 1s linear;
  }
  .icon-space-invader_2:hover:before {
    content: '\\e904';
    transition: content 1s linear;
  }

.icon-space-invader_3:before {
  content: '\\e905';
  transition: content 1s linear;
}
.icon-space-invader_3:hover:before {
  content: '\\e906';
  transition: content 1s linear;
}
`;
