/*!
 * The MIT License (MIT)
 *
 * Copyright (c) 2017 Tomas Hellström (@helto4real) (https://github.com/custom-cards/canvas-gauge-card)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * `canvas-gauge-card`
 * Lovelace element for displaying the canvas gauges at
 * https://canvas-gauges.com/
 *
 * If you like the gauges please support the original gauge devs.
 *
 * Usage:
 *  - see https://github.com/custom-cards/canvas-gauge-card
 */

import {
  LitElement,
  html,
  customElement,
  property,
  CSSResult,
  TemplateResult,
  css,
  query,
  PropertyValues,
} from "lit-element";
import { HomeAssistant, hasConfigOrEntityChanged } from "custom-card-helpers";

import Gauge from "canvas-gauges";

import { CanvasGuageCardConfig } from "./types";
import { CARD_VERSION } from "./const";
import { localize } from "./localize/localize";

/* eslint no-console: 0 */
console.info(
  `%c  CANVAS-GAUGE-CARD \n%c  ${localize(
    "common.version"
  )} ${CARD_VERSION}    `,
  "color: orange; font-weight: bold; background: black",
  "color: white; font-weight: bold; background: dimgray"
);

(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: "canvas-gauge-card",
  name: "Canvas Gauge Card",
  description: "A canvas gauge card from http://canvas-gauges.com/",
});

@customElement("canvas-gauge-card")
export class CanvasGaugeCard extends LitElement {
  public static getStubConfig(): object {
    return {};
  }

  @property() public hass?: HomeAssistant;
  @property() private _config?: CanvasGuageCardConfig;

  private _gaugeWidth?: string;
  private _gaugeHeight?: string;
  private _shadowHeight?: string;
  private _fontSize?: string;
  private _gauge?: any;
  private _state?: string;
  private config?: any;

  @query("#canvaselement") private _canvasElement?: any;

  public setConfig(config: CanvasGuageCardConfig): void {
    if (!config || config.show_error) {
      throw new Error(localize("common.invalid_configuration"));
    }
    // Have no ide why I need to do this or the thing bugs in .. but I do
    this.config = config;

    this._config = {
      gauge: config.gauge,
      ...config,
    };

    this._gaugeWidth = config.card_width
      ? config.card_width
      : config.gauge["width"];

    this._gaugeHeight = config.card_height
      ? config.card_height
      : config.gauge["height"];

    this._shadowHeight = config.shadow_height ? config.shadow_height : "10%";

    this._fontSize = config.font_size
      ? config.font_size
      : `calc(${config.gauge["height"]}px/22)`;
  }

  protected shouldUpdate(changedProps: PropertyValues): boolean {
    return hasConfigOrEntityChanged(this, changedProps, false);
  }

  // Here we need to refresh the actual gauge after it has rendered
  protected updated(_) {
    var gauge;
    if (this._config?.gauge.type == "linear-gauge") {
      gauge = new Gauge.LinearGauge({
        renderTo: this._canvasElement,
        height: this._config.gauge["height"],
        width: this._config.gauge["width"],
        value: 0,
      });
    } else if (this._config?.gauge.type == "radial-gauge") {
      gauge = new Gauge.RadialGauge({
        renderTo: this._canvasElement,
        height: this._config.gauge["height"],
        width: this._config.gauge["width"],
        value: 0,
      });
    }

    for (const key in this._config?.gauge) {
      if (this._config?.gauge?.hasOwnProperty(key)) {
        gauge.options[key] = this._config.gauge[key];
      }
    }
    this._gauge = gauge;
    var entityId = this._config?.entity;
    this._state = this.hass?.states[entityId!].state;
    this._gauge["value"] = this._state;
    this._gauge.draw(); // Have to call to redraw canvas
  }
  protected render(): TemplateResult | void {
    if (!this._config || !this.hass) {
      return html``;
    }

    // Check for stateObj or other necessary things and render a warning if missing
    // if provided in the future, this is a good spot doing just that :)
    if (this._config.show_warning) {
      return html`
        <ha-card>
          <div class="warning">${localize("common.show_warning")}</div>
        </ha-card>
      `;
    }
    return html`
      <style>
        :host {
          box-shadow: var(--ha-card-box-shadow);
          display: block !important;
          border-radius: var(--ha-card-border-radius) !important;
          transition: all 0.3s ease-out !important;
          background-color: var(--ha-card-background) !important;
        }
        #cardroot {
          width: ${this._gaugeWidth}px;
          height: calc(
            ${this._gaugeHeight}px +
              ${this._config.shadow_bottom ? this._config.shadow_bottom : 0}px
          );
          position: relative;
          margin: auto;
        }
        #container {
          width: ${this._gaugeWidth}px;
          height: ${this._gaugeHeight}px;
          position: relative;
          top: 0px;
          overflow: hidden;
          text-align: center;
        }
        #innercontainer {
          position: relative;
          top: ${this._config.card_top ? this._config.card_top : 0};
          left: ${this._config.card_left ? this._config.card_left : 0};
        }
        .shadow {
          width: 100%;
          height: ${this._shadowHeight};
          left: 0px;
          bottom: 0px;
          background: rgba(0, 0, 0, 0.5);
          position: absolute;
        }
        #state {
          position: relative;
          float: left;
          top: 50%;
          left: 50%;
          color: white;
          font-size: 100%;
          transform: translate(-50%, -50%);
        }
      </style>
      <div id="cardroot">
        <div
          id="container"
          width=${this._gaugeWidth}
          height=${this._gaugeHeight}
        >
          <div
            id="innercontainer"
            width=${this._gaugeWidth}
            height=${this._gaugeHeight}
            @click=${this.clickHandler}
          >
            <canvas id="canvaselement"> </canvas>
          </div>
        </div>
        <div id="shadow">
          <div id="state" style="font-size: ${this._fontSize}">
            ${this._config.name}
          </div>
        </div>
      </div>
    `;
  }

  static get styles(): CSSResult {
    return css`
      .warning {
        display: block;
        color: black;
        background-color: #fce588;
        padding: 8px;
      }
    `;
  }
  clickHandler(_) {
    this._fire("hass-more-info", { entityId: this._config?.entity });
  }

  /**
   * Fires the event that opens the enity info
   */
  _fire(type, detail) {
    var event = new Event(type, {
      bubbles: true,
      cancelable: false,
      composed: true,
    }) as any;

    event.detail = detail || {};
    this.shadowRoot?.dispatchEvent(event);
    return event;
  }
}
