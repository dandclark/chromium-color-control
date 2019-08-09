// Copyright (C) 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @fileoverview Color picker used by <input type='color' />
 */

// FIXME: Uncomment the block below when submitting to Chromium.
// function initializeColorPicker() {
//   if (global.params.selectedColor === undefined) {
//     global.params.selectedColor = DefaultColor;
//   }
//   const colorPicker = new ColorPicker(new Color(global.params.selectedColor));
//   main.append(colorPicker);
//   const width = colorPicker.offsetWidth;
//   const height = colorPicker.offsetHeight;
//   resizeWindow(width, height);
// }

// /**
//  * @param {!Object} args
//  * @return {?string} An error message, or null if the argument has no errors.
//  */
// function validateColorPickerArguments(args) {
//   if (args.shouldShowColorSuggestionPicker)
//     return 'Should be showing the color suggestion picker.'
//   if (!args.selectedColor)
//     return 'No selectedColor.';
//   return null;
// }

/**
 * Supported color channels.
 * @enum {number}
 */
const ColorChannel = {
  UNDEFINED: 0,
  HEX: 1,
  R: 2,
  G: 3,
  B: 4,
  H: 5,
  S: 6,
  L: 7,
};

/**
 * Supported color formats.
 * @enum {number}
 */
const ColorFormat = {
  UNDEFINED: 0,
  HEX: 1,
  RGB: 2,
  HSL: 3,
};

/**
 * Color: Helper class to get color values in different color formats.
 */
class Color {
  /**
   * @param {string|!ColorFormat} colorStringOrFormat
   * @param  {...number} colorValues ignored if colorStringOrFormat is a string
   */
  constructor(colorStringOrFormat, ...colorValues) {
    if (typeof colorStringOrFormat === 'string') {
      colorStringOrFormat = colorStringOrFormat.toLowerCase();
      if (colorStringOrFormat.startsWith('#')) {
        this.hexValue_ = colorStringOrFormat.substr(1);
      } else if (colorStringOrFormat.startsWith('rgb')) {
        // Ex. 'rgb(255, 255, 255)' => [255,255,255]
        colorStringOrFormat = colorStringOrFormat.replace(/\s+/g, '');
        [this.rValue_, this.gValue_, this.bValue_] =
            colorStringOrFormat.substring(4, colorStringOrFormat.length - 1)
            .split(',').map(Number);
      } else if (colorStringOrFormat.startsWith('hsl')) {
        colorStringOrFormat = colorStringOrFormat.replace(/%|\s+/g, '');
        [this.hValue_, this.sValue_, this.lValue_] =
            colorStringOrFormat.substring(4, colorStringOrFormat.length - 1)
            .split(',').map(Number);
      }
    } else {
      switch(colorStringOrFormat) {
        case ColorFormat.HEX:
          this.hexValue_ = colorValues[0].toLowerCase();
          break;
        case ColorFormat.RGB:
          [this.rValue_, this.gValue_, this.bValue_] = colorValues.map(Number);
          break;
        case ColorFormat.HSL:
          [this.hValue_, this.sValue_, this.lValue_] = colorValues.map(Number);
          break;
      }
    }
  }

  /**
   * @param {!Color} other
   */
  equals(other) {
    return (this.hexValue === other.hexValue);
  }

  /**
   * @returns {string}
   */
  get hexValue() {
    this.computeHexValue_();
    return this.hexValue_;
  }

  computeHexValue_() {
    if (this.hexValue_ !== undefined) {
      // Already computed.
    } else if (this.rValue_ !== undefined) {
      this.hexValue_ =
          Color.rgbToHex(this.rValue_, this.gValue_, this.bValue_);
    } else if (this.hValue_ !== undefined) {
      this.hexValue_ =
          Color.hslToHex(this.hValue_, this.sValue_, this.lValue_);
    }
  }

  asHex() {
    return '#' + this.hexValue;
  }

  /**
   * @returns {number} between 0 and 255
   */
  get rValue() {
    this.computeRGBValues_();
    return this.rValue_;
  }

  /**
   * @returns {number} between 0 and 255
   */
  get gValue() {
    this.computeRGBValues_();
    return this.gValue_;
  }

  /**
   * @returns {number} between 0 and 255
   */
  get bValue() {
    this.computeRGBValues_();
    return this.bValue_;
  }

  computeRGBValues_() {
    if (this.rValue_ !== undefined) {
      // Already computed.
    } else if (this.hexValue_ !== undefined) {
      [this.rValue_, this.gValue_, this.bValue_] =
          Color.hexToRGB(this.hexValue_);
    } else if (this.hValue_ !== undefined) {
      [this.rValue_, this.gValue_, this.bValue_] =
          Color.hslToRGB(this.hValue_, this.sValue_, this.lValue_)
          .map(Math.round);
    }
  }

  rgbValues() {
    return [this.rValue, this.gValue, this.bValue];
  }

  asRGB() {
    return 'rgb(' + this.rgbValues().join() + ')';
  }

  /**
   * @returns {number} between 0 and 359
   */
  get hValue() {
    this.computeHSLValues_();
    return this.hValue_;
  }

  /**
   * @returns {number} between 0 and 100
   */
  get sValue() {
    this.computeHSLValues_();
    return this.sValue_;
  }

  /**
   * @returns {number} between 0 and 100
   */
  get lValue() {
    this.computeHSLValues_();
    return this.lValue_;
  }

  computeHSLValues_() {
    if (this.hValue_ !== undefined) {
      // Already computed.
    } else if (this.rValue_ !== undefined) {
      [this.hValue_, this.sValue_, this.lValue_] =
          Color.rgbToHSL(this.rValue_, this.gValue_, this.bValue_)
          .map(Math.round);
    } else if (this.hexValue_ !== undefined) {
      [this.hValue_, this.sValue_, this.lValue_] =
          Color.hexToHSL(this.hexValue_).map(Math.round);
    }
  }

  hslValues() {
    return [this.hValue, this.sValue, this.lValue];
  }

  asHSL() {
    return 'hsl(' + this.hValue + ',' + this.sValue + '%,' + this.lValue + '%)';
  }

  /**
   * @param {string} hexValue
   * @returns {number[]}
   */
  static hexToRGB(hexValue) {
    // Ex. 'ffffff' => '[255,255,255]'
    const colorValue = parseInt(hexValue, 16);
    return [(colorValue >> 16) & 255, (colorValue >> 8) & 255, colorValue & 255];
  }

  /**
   * @param {...number} rgbValues
   * @returns {string}
   */
  static rgbToHex(...rgbValues) {
    // Ex. '[255,255,255]' => 'ffffff'
    return rgbValues.reduce((cumulativeHexValue, rgbValue) => {
      let hexValue = Number(rgbValue).toString(16);
      if(hexValue.length == 1) {
        hexValue = '0' + hexValue;
      }
      return (cumulativeHexValue + hexValue);
    }, '');
  }

  /**
   * The algorithm has been written based on the mathematical formula found at:
   * https://en.wikipedia.org/wiki/HSL_and_HSV#HSL_to_RGB.
   * @param {...number} hslValues
   * @returns {number[]}
   */
  static hslToRGB(...hslValues) {
    let [hValue, sValue, lValue] = hslValues;
    hValue /= 60;
    sValue /= 100;
    lValue /= 100;

    let rValue = lValue;
    let gValue = lValue;
    let bValue = lValue;
    let match = 0;
    if (sValue !== 0) {
      const chroma = (1 - Math.abs(2 * lValue - 1)) * sValue;
      const x = chroma * (1 - Math.abs(hValue % 2 - 1));
      match = lValue - chroma / 2;
      if ((0 <= hValue) && (hValue <= 1)) {
        rValue = chroma;
        gValue = x;
        bValue = 0;
      } else if ((1 < hValue) && (hValue <= 2)) {
        rValue = x;
        gValue = chroma;
        bValue = 0;
      } else if ((2 < hValue) && (hValue <= 3)) {
        rValue = 0;
        gValue = chroma;
        bValue = x;
      } else if ((3 < hValue) && (hValue <= 4)) {
        rValue = 0;
        gValue = x;
        bValue = chroma;
      } else if ((4 < hValue) && (hValue <= 5)) {
        rValue = x;
        gValue = 0;
        bValue = chroma;
      } else {
        // (5 < hValue) && (hValue < 6)
        rValue = chroma;
        gValue = 0;
        bValue = x;
      }
    }
    rValue = (rValue + match) * 255;
    gValue = (gValue + match) * 255;
    bValue = (bValue + match) * 255;
    return [rValue, gValue, bValue];
  }

  /**
   * The algorithm has been written based on the mathematical formula found at:
   * https://en.wikipedia.org/wiki/HSL_and_HSV#From_RGB.
   * @param {...number} rgbValues
   * @returns {number[]}
   */
  static rgbToHSL(...rgbValues) {
    const [rValue, gValue, bValue] = rgbValues.map((value) => value / 255);
    const max = Math.max(rValue, gValue, bValue);
    const min = Math.min(rValue, gValue, bValue);
    let hValue = 0;
    let sValue = 0;
    let lValue = (max + min) / 2;
    if (max !== min) {
      const diff = max - min;
      if (max === rValue) {
        hValue = ((gValue - bValue) / diff);
      } else if (max === gValue) {
        hValue = ((bValue - rValue) / diff) + 2;
      } else {
        // max === bValue
        hValue = ((rValue - gValue) / diff) + 4;
      }
      hValue *= 60;
      if (hValue < 0) {
        hValue += 360;
      }
      sValue = (diff / (1 - Math.abs(2 * lValue - 1))) * 100;
    }
    lValue *= 100;
    return [hValue, sValue, lValue];
  }

  /**
   * @param {...number} rgbValues
   * @returns {string}
   */
  static hslToHex(...hslValues) {
    return Color.rgbToHex(...Color.hslToRGB(...hslValues).map(Math.round));
  }

  /**
   * @param {string} hexValue
   * @returns {...number}
   */
  static hexToHSL(hexValue) {
    return Color.rgbToHSL(...Color.hexToRGB(hexValue));
  }
}

class Point {
  /**
   * @param {number} x
   * @param {number} y
   */
  constructor(x, y) {
    this.set(x, y);
  }

  /**
   * @param {number} x
   * @param {number} y
   */
  set(x, y) {
    this.x = x;
    this.y = y;
  }

  get x() {
    return this.x_;
  }

  /**
   * @param {number} x
   */
  set x(x) {
    this.x_ = x;
  }

  get y() {
    return this.y_;
  }

  /**
   * @param {number} y
   */
  set y(y) {
    this.y_ = y;
  }
}

/**
 * ColorPicker: Custom element providing a color picker implementation.
 *              A color picker is comprised of three main parts: a visual color
 *              picker to allow visual selection of colors, a manual color
 *              picker to allow numeric selection of colors, and submission
 *              controls to save/discard new color selections.
 */
class ColorPicker extends HTMLElement {
  /**
   * @param {!Color} initialColor
   */
  constructor(initialColor) {
    super();

    this.selectedColor_ = initialColor;

    this.visualColorPicker_ = new VisualColorPicker(initialColor);
    this.manualColorPicker_ = new ManualColorPicker(initialColor);
    this.submissionControls_ =
        new SubmissionControls(this.onSubmitButtonClick_,
                               this.onCancelButtonClick_);
    this.append(this.visualColorPicker_,
                this.manualColorPicker_,
                this.submissionControls_);

    this.manualColorPicker_
        .addEventListener('manual-color-change', this.onManualColorChange_);

    this.addEventListener('visual-color-change', this.onVisualColorChange_);
  }

  get selectedColor() {
    return this.selectedColor_;
  }

  /**
   * @param {!Color} newColor
   */
  set selectedColor(newColor) {
    if (!this.selectedColor_.equals(newColor)) {
      this.dispatchEvent(new CustomEvent('color-change'));
    }
    // FIXME: Remove the block above when submitting to Chromium.
    this.selectedColor_ = newColor;
  }

  /**
   * @param {!Event} event
   */
  onManualColorChange_ = (event) => {
    const newColor = event.detail.color;
    if (!this.selectedColor_.equals(newColor)) {
      this.selectedColor = newColor;

      // There may not be an exact match for newColor in the color well, in
      // which case we will find the closest match. When this happens though,
      // we want the manually chosen values to remain the selected values (as
      // they were explicitly specified by the user). Therefore, we need to
      // prevent them from getting overwritten when onVisualColorChange_ runs.
      // We do this by setting the processingManualColorChange_ flag here and
      // checking for it inside onVisualColorChange_. If the flag is set, the
      // manual color values will not be updated with the color shown in the
      // visual color picker.
      this.processingManualColorChange_ = true;
      this.visualColorPicker_.color = newColor;
      this.processingManualColorChange_ = false;
    }
  }

  /**
   * @param {!Event} event
   */
  onVisualColorChange_ = (event) => {
    const newColor = event.detail.color;
    if (!this.selectedColor.equals(newColor)) {
      if (!this.processingManualColorChange_) {
        this.selectedColor = newColor;
        this.manualColorPicker_.color = newColor;
      } else {
        // We are in the process of making a visual color update in response to
        // a manual color change. So we do not re-set the manually selected
        // color.
      }
    }
  }

  // FIXME: Uncomment the block below when submitting to Chromium.
  // onSubmitButtonClick_ = () => {
  //   const selectedValue = this.selectedColor_.asHex();
  //   window.setTimeout(function() {
  //     window.pagePopupController.setValueAndClosePopup(0, selectedValue);
  //   }, 100);
  // }

  // onCancelButtonClick_ = () => {
  //   window.pagePopupController.closePopup();
  // }
}
window.customElements.define('color-picker', ColorPicker);

/**
 * VisualColorPicker: Provides functionality to see the selected color and
 *                    select a different color visually.
 * TODO(crbug.com/983311): Allow colors to be selected from within the visual
 *                         color picker.
 */
class VisualColorPicker extends HTMLElement {
  /**
   * @param {!Color} initialColor
   */
  constructor(initialColor) {
    super();

    let visualColorPickerStrip = document.createElement('span');
    visualColorPickerStrip.setAttribute('id', 'visual-color-picker-strip');
    this.eyeDropper_ = new EyeDropper();
    this.colorSwatch_ = new ColorSwatch(initialColor);
    this.hueSlider_ = new HueSlider(initialColor);
    visualColorPickerStrip.append(this.eyeDropper_,
                                  this.colorSwatch_,
                                  this.hueSlider_);
    this.append(visualColorPickerStrip);

    this.colorWell_ = new ColorWell(initialColor);
    this.prepend(this.colorWell_);

    this.addEventListener('hue-slider-update', this.onHueSliderUpdate_);
    this.addEventListener('visual-color-change', this.onVisualColorChange_);
    this.colorWell_.addEventListener('mousedown', this.onColorWellMouseDown_);
    this.hueSlider_.addEventListener('mousedown', this.onHueSliderMouseDown_);
    this.colorWell_
        .addEventListener('mousedown', (event) => event.preventDefault());
    this.hueSlider_
        .addEventListener('mousedown', (event) => event.preventDefault());
    document.documentElement.addEventListener('mousemove', this.onMouseMove_);
    document.documentElement.addEventListener('mouseup', this.onMouseUp_);
  }

  onHueSliderUpdate_ = () => {
    this.colorWell_.fillColor = this.hueSlider_.color;
  }

  /**
   * @param {!Event} event
   */
  onVisualColorChange_ = (event) => {
    this.colorSwatch_.color = event.detail.color;
  }

  /**
   * @param {!Event} event
   */
  onColorWellMouseDown_ = (event) => {
    this.colorWell_.mouseDown(new Point(event.clientX, event.clientY));
  }

  /**
   * @param {!Event} event
   */
  onMouseMove_ = (event) => {
    var point = new Point(event.clientX, event.clientY);
    this.colorWell_.mouseMove(point);
    this.hueSlider_.mouseMove(point);
  }

  onMouseUp_ = () => {
    this.colorWell_.mouseUp();
    this.hueSlider_.mouseUp();
  }

  /**
   * @param {!Event} event
   */
  onHueSliderMouseDown_ = (event) => {
    this.hueSlider_.mouseDown(new Point(event.clientX, event.clientY));
  }

  /**
   * @param {!Color} newColor
   */
  set color(newColor) {
    this.hueSlider_.color = newColor;
    this.colorWell_.selectedColor = newColor;
  }
}
window.customElements.define('visual-color-picker', VisualColorPicker);

/**
 * EyeDropper:
 * TODO(FIXME: file bug):
 */
class EyeDropper extends HTMLElement { }
window.customElements.define('eye-dropper', EyeDropper);

class ColorSwatch extends HTMLElement {
  /**
   * @param {!Color} initialColor
   */
  constructor(initialColor) {
    super();

    this.color = initialColor;
  }

  get color() {
    return this.color_;
  }

  /**
   * @param {!Color} color
   */
  set color(color) {
    if (this.color_ !== color) {
      this.color_ = color;
      this.style.backgroundColor = color.asRGB();
    }
  }
}
window.customElements.define('color-swatch', ColorSwatch);

class ColorSelectionArea extends HTMLElement {
  constructor() {
    super();

    this.colorPalette_ = new ColorPalette();
    this.colorSelectionRing_ = new ColorSelectionRing(this.colorPalette_);
    this.append(this.colorPalette_, this.colorSelectionRing_);
  }

  /**
   * @param {!Point} point
   */
  mouseDown(point) {
    this.colorSelectionRing_.setDrag();
    this.moveColorSelectionRingTo_(point);
  }

  /**
   * @param {!Point} point
   */
  mouseMove(point) {
    if (this.colorSelectionRing_.isBeingDragged) {
      this.moveColorSelectionRingTo_(point);
    }
  }

  mouseUp() {
    this.colorSelectionRing_.clearDrag();
  }
}
window.customElements.define('color-selection-area', ColorSelectionArea);

class ColorPalette extends HTMLCanvasElement {
  constructor() {
    super();

    this.gradients_ = [];
  }

  /**
   * @param {!Color} color
   */
  initialize(color) {
    this.width = this.offsetWidth;
    this.height = this.offsetHeight;
    this.renderingContext.rect(0, 0, this.width, this.height);
    this.fillColor = color;
  }

  get hslImageData() {
    if (this.pendingColorChange_) {
      const rgbaImageData = this.renderingContext
          .getImageData(0, 0, this.width, this.height).data;
      this.hslImageData_ = rgbaImageData
        .reduce((hslArray, {}, currentIndex, rgbaArray) => {
          if ((currentIndex % 4) === 0) {
            hslArray.push(...Color.rgbToHSL(rgbaArray[currentIndex],
                                            rgbaArray[currentIndex + 1],
                                            rgbaArray[currentIndex + 2])
                          .map(Math.round));
          }
          return hslArray;
        }, []);
      this.pendingColorChange_ = false;
    }
    if (this.pendingHueChange_) {
      const hValueToSet = this.fillColor.hValue;
      this.hslImageData_.forEach((hslValue, currentIndex, hslArray) => {
        if ((currentIndex % 3) === 0 && hslValue != 0) {
          hslArray[currentIndex] = hValueToSet;
        }
      });

      this.pendingHueChange_ = false;
    }

    return this.hslImageData_;
  }

  /**
   * @param {number} x
   * @param {number} y
   */
  hslImageDataAtPosition_(x, y) {
    const offset = Math.round(y * this.width + x) * 3;
    return this.hslImageData.slice(offset, offset + 3);
  }

  /**
   * @param {!Point} point
   */
  colorAtPoint(point) {
    const hslImageDataAtPoint =
        this.hslImageDataAtPosition_(point.x - this.left, point.y - this.top);
    return new Color(ColorFormat.HSL, hslImageDataAtPoint[0],
        hslImageDataAtPoint[1], hslImageDataAtPoint[2]);
  }

  get renderingContext() {
    return this.getContext('2d');
  }

  get fillColor() {
    return this.fillColor_;
  }

  /**
   * @param {!Color} color
   */
  set fillColor(color) {
    this.fillColor_ = color;
    this.fillColorAndGradients_();
    this.pendingColorChange_ = true;
  }

  /**
   * @param {!Color} color
   */
  fillHue(color) {
    this.fillColor = new Color(ColorFormat.HSL, color.hValue, 100, 50);
    this.fillColorAndGradients_();
    this.pendingHueChange_ = true;
  }

  fillColorAndGradients_() {
    this.fillWithStyle_(this.fillColor_.asRGB());
    this.gradients_.forEach((gradient) => this.fillWithStyle_(gradient));
  }

  /**
   * @param {...number} gradientsToAdd
   */
  addGradients(...gradientsToAdd) {
    this.gradients_.push(...gradientsToAdd);
    gradientsToAdd.forEach((gradient) => this.fillWithStyle_(gradient));
  }

  /**
   * @param {string|CanvasGradient} fillStyle
   */
  fillWithStyle_(fillStyle) {
    let colorPaletteCtx = this.renderingContext;
    colorPaletteCtx.fillStyle = fillStyle;
    colorPaletteCtx.fill();
  }

  /**
   * @param {!Point} point
   */
  nearestPointOnColorPalette(point) {
    if (!this.isXCoordinateOnColorPalette_(point)) {
      if (point.x >= this.right) {
        point.x = this.right - 1;
      } else if (point.x < this.left) {
        point.x = this.left;
      }
    }
    if (!this.isYCoordinateOnColorPalette_(point)) {
      if (point.y >= this.bottom) {
        point.y = this.bottom - 1;
      } else if (point.y < this.top) {
        point.y = this.top;
      }
    }
    return point;
  }

  /**
   * @param {!Point} point
   */
  isXCoordinateOnColorPalette_(point) {
    return (point.x >= this.left) && (point.x < this.right);
  }

  /**
   * @param {!Point} point
   */
  isYCoordinateOnColorPalette_(point) {
    return (point.y >= this.top) && (point.y < this.bottom);
  }

  get left() {
    return this.getBoundingClientRect().left;
  }

  get right() {
    return this.getBoundingClientRect().right;
  }

  get top() {
    return this.getBoundingClientRect().top;
  }

  get bottom() {
    return this.getBoundingClientRect().bottom;
  }
}
window.customElements.define('color-palette',
                             ColorPalette,
                             { extends: 'canvas' });

class ColorSelectionRing extends HTMLElement {
  /**
   * @param {!ColorPalette} backingColorPalette
   */
  constructor(backingColorPalette) {
    super();

    this.backingColorPalette_ = backingColorPalette;
    this.position_ = new Point(0, 0);
    this.isBeingDragged_ = false;
  }

  initialize() {
    this.set(this.backingColorPalette_.left, this.backingColorPalette_.top);
  }

  setElementPosition_() {
    if (this.height > this.backingColorPalette_.height) {
      this.style.top = this.top
          - (this.height - this.backingColorPalette_.height) / 2
          - this.backingColorPalette_.top + 'px';
    } else {
      this.style.top = this.top - this.radius
          - this.backingColorPalette_.top + 'px';
    }
    if (this.width > this.backingColorPalette_.width) {
      this.style.left = this.left
          - (this.width - this.backingColorPalette_.width) / 2
          - this.backingColorPalette_.top + 'px';
    } else {
      this.style.left = this.left - this.radius
          - this.backingColorPalette_.left + 'px';
    }
  }

  /**
   * @param {!Point} newPosition
   */
  moveTo(newPosition) {
    this.set(newPosition.x, newPosition.y);
  }

  /**
   * @param {number} x
   * @param {number} y
   */
  set(x, y) {
    if ((x !== this.position_.x) || (y !== this.position_.y)) {
      this.position_.x = x;
      this.position_.y = y;
      this.onPositionChange_();
    }
  }

  /**
   * @param {number} x
   */
  setX(x) {
    if (x !== this.position_.x) {
      this.position_.x = x;
      this.onPositionChange_();
    }
  }

  /**
   * @param {number} shiftFactor
   */
  shiftX(shiftFactor) {
    this.setX(this.position_.x + shiftFactor);
  }

  onPositionChange_() {
    this.setElementPosition_();
    this.refreshColor();
  }

  get isBeingDragged() {
    return this.isBeingDragged_;
  }

  setDrag() {
    this.isBeingDragged_ = true;
  }

  clearDrag() {
    this.isBeingDragged_ = false;
  }

  get color() {
    return this.color_;
  }

  /**
   * @param {!Color} color
   */
  set color(color) {
    if (this.color_ === undefined || !this.color_.equals(color)) {
      this.color_ = color;
      this.style.backgroundColor = color.asRGB();
    }
  }

  refreshColor() {
    this.color = this.backingColorPalette_.colorAtPoint(this.position_);
    this.dispatchEvent(new CustomEvent('color-selection-ring-update'));
  }

  get radius() {
    return this.width / 2;
  }

  get width() {
    return this.getBoundingClientRect().width;
  }

  get height() {
    return this.getBoundingClientRect().height;
  }

  get left() {
    return this.position_.x;
  }

  get right() {
    return this.position_.x + this.width;
  }

  get top() {
    return this.position_.y;
  }

  get bottom() {
    return this.position_.y + this.height;
  }
}
window.customElements.define('color-selection-ring', ColorSelectionRing);

class ColorWell extends ColorSelectionArea {
  /**
   * @param {!Color} initialColor
   */
  constructor(initialColor) {
    super();

    this.fillColor_ = new Color(ColorFormat.HSL, initialColor.hValue, 100, 50);
    this.selectedColor_ = initialColor;
    this.initialized_ = false;

    window.addEventListener('load', () => {
      this.initialize();

      this.colorSelectionRing_.addEventListener('color-selection-ring-update',
          this.onColorSelectionRingUpdate_);

      this.moveColorSelectionRingTo_(this.selectedColor_);
    });
  }

  initialize() {
    if (!this.initialized_) {
      let whiteGradient = this.colorPalette_.renderingContext
          .createLinearGradient(0, 0, this.colorPalette_.offsetWidth, 0);
      whiteGradient.addColorStop(0.01, 'hsla(0, 0%, 100%, 1)');
      whiteGradient.addColorStop(0.99, 'hsla(0, 0%, 100%, 0)');
      let blackGradient = this.colorPalette_.renderingContext
          .createLinearGradient(0, this.colorPalette_.offsetHeight, 0, 0);
      blackGradient.addColorStop(0.01, 'hsla(0, 0%, 0%, 1)');
      blackGradient.addColorStop(0.99, 'hsla(0, 0%, 0%, 0)');
      this.colorPalette_.addGradients(whiteGradient, blackGradient);

      this.colorPalette_.initialize(this.fillColor_);
      this.colorSelectionRing_.initialize();

      this.initialized_ = true;
    }
  }

  /**
   * @param {!Point|!Color} newPositionOrColor
   */
  moveColorSelectionRingTo_(newPositionOrColor) {
    if (newPositionOrColor instanceof Point) {
      const point =
          this.colorPalette_.nearestPointOnColorPalette(newPositionOrColor);
      this.colorSelectionRing_.moveTo(point);
    } else {
      function hslValueDistance(hslTripleA, hslTripleB) {
        return Math.sqrt(Math.pow(hslTripleB[0] - hslTripleA[0], 2)
            + Math.pow(hslTripleB[1] - hslTripleA[1], 2)
            + Math.pow(hslTripleB[2] - hslTripleA[2], 2));
      }

      const closestHSLValueIndex = this.colorPalette_.hslImageData
          .reduce((closestSoFar, {}, index, array) => {
            if ((index % 3) === 0) {
              const currentHSLValueDistance = hslValueDistance([array[index],
                array[index + 1], array[index + 2]],
                  newPositionOrColor.hslValues());
              const closestHSLValueDistance =
                hslValueDistance([array[closestSoFar], array[closestSoFar + 1],
                  array[closestSoFar + 2]], newPositionOrColor.hslValues());
              if (currentHSLValueDistance < closestHSLValueDistance) {
                return index;
              }
            }
            return closestSoFar;
          }, 0);
      const offsetX = (closestHSLValueIndex / 3) % this.colorPalette_.width;
      const offsetY =
          Math.floor((closestHSLValueIndex / 3) / this.colorPalette_.width);
      this.colorSelectionRing_.set(this.colorPalette_.left + offsetX,
                                  this.colorPalette_.top + offsetY);
    }
  }

  get selectedColor() {
    return this.selectedColor_;
  }

  /**
   * @param {!Color} newColor
   */
  set selectedColor(newColor) {
    this.selectedColor_ = newColor;
    this.moveColorSelectionRingTo_(newColor);
  }

  get fillColor() {
    return this.fillColor_;
  }

  /**
   * @param {!Color} color
   */
  set fillColor(color) {
    this.fillColor_ = color;
    this.initialize();
    this.colorPalette_.fillHue(color);
    this.colorSelectionRing_.refreshColor();
  }

  onColorSelectionRingUpdate_ = () => {
    this.selectedColor_ = this.colorSelectionRing_.color;
    this.dispatchEvent(new CustomEvent('visual-color-change', {
      bubbles: true,
      detail: {
        color: this.selectedColor
      }
    }));
  }
}
window.customElements.define('color-well', ColorWell);

class HueSlider extends ColorSelectionArea {
  /**
   * @param {!Color} initialColor
   */
  constructor(initialColor) {
    super();

    this.color_ = new Color(ColorFormat.HSL, initialColor.hValue, 100, 50);

    window.addEventListener('load', () => {
      let hueSliderPaletteGradient = this.colorPalette_.renderingContext
          .createLinearGradient(0, 0, this.colorPalette_.offsetWidth, 0);
      hueSliderPaletteGradient.addColorStop(0.01, 'hsl(0, 100%, 50%)');
      hueSliderPaletteGradient.addColorStop(0.17, 'hsl(300, 100%, 50%)');
      hueSliderPaletteGradient.addColorStop(0.33, 'hsl(240, 100%, 50%)');
      hueSliderPaletteGradient.addColorStop(0.5, 'hsl(180, 100%, 50%)');
      hueSliderPaletteGradient.addColorStop(0.67, 'hsl(120, 100%, 50%)');
      hueSliderPaletteGradient.addColorStop(0.83, 'hsl(60, 100%, 50%)');
      hueSliderPaletteGradient.addColorStop(0.99, 'hsl(0, 100%, 50%)');
      this.colorPalette_.addGradients(hueSliderPaletteGradient);

      this.colorPalette_.initialize(new Color('hsl(0, 100%, 50%)'));
      this.colorSelectionRing_.initialize();

      this.colorSelectionRing_.addEventListener('color-selection-ring-update',
          this.onColorSelectionRingUpdate_);

      this.moveColorSelectionRingTo_(this.color_);
    });
  }

  /**
   * @param {!Point|!Color} newPositionOrColor
   */
  moveColorSelectionRingTo_(newPositionOrColor) {
    if (newPositionOrColor instanceof Point) {
      const point =
          this.colorPalette_.nearestPointOnColorPalette(newPositionOrColor);
      this.colorSelectionRing_.shiftX(point.x - this.colorSelectionRing_.left);
    } else {
      if (newPositionOrColor.hValue
          !== this.colorSelectionRing_.color.hValue) {
        const targetHValue = newPositionOrColor.hValue;
        const closestHValueIndex = this.colorPalette_.hslImageData
            .reduce((closestHValueIndexSoFar, currentHValue, index, array) => {
              if ((index % 3 === 0) &&
                (Math.abs(currentHValue - targetHValue) <
                  Math.abs(array[closestHValueIndexSoFar] - targetHValue))) {
                return index;
              }
              return closestHValueIndexSoFar;
        }, 0);
        const offsetX = (closestHValueIndex / 3) % this.colorPalette_.width;
        this.colorSelectionRing_.setX(this.colorPalette_.left + offsetX);
      }
    }
  }

  get color() {
    return this.color_;
  }

  /**
   * @param {!Color} newColor
   */
  set color(newColor) {
    this.color_ = new Color(ColorFormat.HSL, newColor.hValue, 100, 50);
    this.moveColorSelectionRingTo_(this.color_);
  }

  onColorSelectionRingUpdate_ = () => {
    this.color_ = this.colorSelectionRing_.color;
    this.dispatchEvent(new CustomEvent('hue-slider-update', {
      bubbles: true
    }));
  }
}
window.customElements.define('hue-slider', HueSlider);

/**
 * ManualColorPicker: Provides functionality to change the selected color by
 *                    manipulating its numeric values.
 */
class ManualColorPicker extends HTMLElement {
  /**
   * @param {!Color} initialColor
   */
  constructor(initialColor) {
    super();

    this.hexValueContainer_ = new ColorValueContainer(ColorChannel.HEX,
                                                      initialColor);
    this.rgbValueContainer_ = new ColorValueContainer(ColorFormat.RGB,
                                                      initialColor);
    this.hslValueContainer_ = new ColorValueContainer(ColorFormat.HSL,
                                                      initialColor);
    this.colorValueContainers_ = [
      this.hexValueContainer_,
      this.rgbValueContainer_,
      this.hslValueContainer_,
    ];
    this.currentColorFormat_ = ColorFormat.RGB;
    this.adjustValueContainerVisibility_();
    this.formatToggler_ = new FormatToggler(this.currentColorFormat_);
    this.append(...this.colorValueContainers_, this.formatToggler_);

    this.formatToggler_
    .addEventListener('format-change', this.onFormatChange_);

    this.addEventListener('manual-color-change', this.onManualColorChange_);
  }

  adjustValueContainerVisibility_() {
    this.colorValueContainers_.forEach((colorValueContainer) => {
      if (colorValueContainer.colorFormat === this.currentColorFormat_) {
        colorValueContainer.show();
      } else {
        colorValueContainer.hide();
      }
    });
  }

  /**
   * @param {!Event} event
   */
  onFormatChange_ = (event) => {
    this.currentColorFormat_ = event.detail.colorFormat;
    this.adjustValueContainerVisibility_();
  }

  /**
   * @param {!Event} event
   */
  onManualColorChange_ = (event) => {
    this.color = event.detail.color;
  }

  /**
   * @param {!Color} newColor
   */
  set color(newColor) {
    this.colorValueContainers_.forEach((colorValueContainer) =>
        colorValueContainer.color = newColor);
  }
}
window.customElements.define('manual-color-picker', ManualColorPicker);

/**
 * ColorValueContainer: Maintains a set of channel values that make up a given
 *                      color format, and tracks value changes.
 */
class ColorValueContainer extends HTMLElement {
  /**
   * @param {!ColorFormat} colorFormat
   * @param {!Color} initialColor
   */
  constructor(colorFormat, initialColor) {
    super();

    this.colorFormat_ = colorFormat;
    this.channelValueContainers_ = [];
    if (this.colorFormat_ === ColorFormat.HEX) {
      const hexValueContainer = new ChannelValueContainer(ColorChannel.HEX,
                                                          initialColor);
      this.channelValueContainers_.push(hexValueContainer);
    } else if (this.colorFormat_ === ColorFormat.RGB) {
      const rValueContainer = new ChannelValueContainer(ColorChannel.R,
                                                        initialColor);
      const gValueContainer = new ChannelValueContainer(ColorChannel.G,
                                                        initialColor);
      const bValueContainer = new ChannelValueContainer(ColorChannel.B,
                                                        initialColor);
      this.channelValueContainers_.push(rValueContainer,
                                        gValueContainer,
                                        bValueContainer);
    } else if (this.colorFormat_ === ColorFormat.HSL) {
      const hValueContainer = new ChannelValueContainer(ColorChannel.H,
                                                        initialColor);
      const sValueContainer = new ChannelValueContainer(ColorChannel.S,
                                                        initialColor);
      const lValueContainer = new ChannelValueContainer(ColorChannel.L,
                                                        initialColor);
      this.channelValueContainers_.push(hValueContainer,
                                        sValueContainer,
                                        lValueContainer);
    }
    this.append(...this.channelValueContainers_);

    this.channelValueContainers_.forEach((channelValueContainer) =>
        channelValueContainer.addEventListener('input',
            this.onChannelValueChange_));
  }

  get colorFormat() {
    return this.colorFormat_;
  }

  get color() {
    return new Color(this.colorFormat_,
        ...this.channelValueContainers_.map((channelValueContainer) =>
            channelValueContainer.channelValue));
  }

  /**
   * @param {!Color} color
   */
  set color(color) {
    this.channelValueContainers_.forEach((channelValueContainer) =>
        channelValueContainer.setValue(color));
  }

  show() {
    return this.classList.remove('hidden-color-value-container');
  }

  hide() {
    return this.classList.add('hidden-color-value-container');
  }

  onChannelValueChange_ = () => {
    this.dispatchEvent(new CustomEvent('manual-color-change', {
      bubbles: true,
      detail: {
        color: this.color
      }
    }));
  }
}
window.customElements.define('color-value-container', ColorValueContainer);

/**
 * ChannelValueContainer: Maintains and displays the numeric value
 *                        for a given color channel.
 */
class ChannelValueContainer extends HTMLInputElement {
  /**
   * @param {!ColorChannel} colorChannel
   * @param {!Color} initialColor
   */
  constructor(colorChannel, initialColor) {
    super();

    this.setAttribute('type', 'text');
    this.colorChannel_ = colorChannel;
    switch(colorChannel) {
      case ColorChannel.HEX:
        this.setAttribute('maxlength', '7');
        break;
      case ColorChannel.R:
      case ColorChannel.G:
      case ColorChannel.B:
        this.setAttribute('maxlength', '3');
        break;
      case ColorChannel.H:
        this.setAttribute('maxlength', '3');
        break;
      case ColorChannel.S:
      case ColorChannel.L:
        // up to 3 digits plus '%'
        this.setAttribute('maxlength', '4');
        break;
    }
    this.setValue(initialColor);

    this.addEventListener('input', this.onValueChange_);
  }

  get channelValue() {
    return this.channelValue_;
  }

  /**
   * @param {!Color} color
   */
  setValue(color) {
    switch(this.colorChannel_) {
      case ColorChannel.HEX:
        if (this.channelValue_ !== color.hexValue) {
          this.channelValue_ = color.hexValue;
          this.value = '#' + this.channelValue_;
        }
        break;
      case ColorChannel.R:
        if (this.channelValue_ !== color.rValue) {
          this.channelValue_ = color.rValue;
          this.value = this.channelValue_;
        }
        break;
      case ColorChannel.G:
        if (this.channelValue_ !== color.gValue) {
          this.channelValue_ = color.gValue;
          this.value = this.channelValue_;
        }
        break;
      case ColorChannel.B:
        if (this.channelValue_ !== color.bValue) {
          this.channelValue_ = color.bValue;
          this.value = this.channelValue_;
        }
        break;
      case ColorChannel.H:
        if (this.channelValue_ !== color.hValue) {
          this.channelValue_ = color.hValue;
          this.value = this.channelValue_;
        }
        break;
      case ColorChannel.S:
        if (this.channelValue_ !== color.sValue) {
          this.channelValue_ = color.sValue;
          this.value = this.channelValue_ + '%';
        }
        break;
      case ColorChannel.L:
        if (this.channelValue_ !== color.lValue) {
          this.channelValue_ = color.lValue;
          this.value = this.channelValue_ + '%';
        }
        break;
    }
  }

  onValueChange_ = () => {
    // Set this.channelValue_ based on the element's new value.
    let value = this.value;
    if (value) {
      switch(this.colorChannel_) {
        case ColorChannel.HEX:
          if (value.startsWith('#')) {
            value = value.substr(1).toLowerCase();
            if (value.match(/^[0-9a-f]+$/)) {
              // Ex. 'ffffff' => this.channelValue_ == 'ffffff'
              // Ex. 'ff' => this.channelValue_ == '0000ff'
              this.channelValue_ = ('000000' + value).slice(-6);
            }
          }
          break;
        case ColorChannel.R:
        case ColorChannel.G:
        case ColorChannel.B:
          if (value.match(/^\d+$/) && (0 <= value) && (value <= 255)) {
            this.channelValue_ = Number(value);
          }
          break;
        case ColorChannel.H:
          if (value.match(/^\d+$/) && (0 <= value) && (value < 360)) {
            this.channelValue_ = Number(value);
          }
          break;
        case ColorChannel.S:
        case ColorChannel.L:
          if (value.endsWith('%')) {
            value = value.substring(0, value.length - 1);
            if (value.match(/^\d+$/) && (0 <= value) && (value <= 100)) {
              this.channelValue_ = Number(value);
            }
          }
          break;
      }
    }
  }
}
window.customElements.define('channel-value-container',
                             ChannelValueContainer,
                             { extends: 'input' });

/**
 * FormatToggler: Button that powers switching between different color formats.
 */
class FormatToggler extends HTMLElement {
  /**
   * @param {!ColorFormat} initialColorFormat
   */
  constructor(initialColorFormat) {
    super();

    this.currentColorFormat_ = initialColorFormat;
    this.hexFormatLabel_ = new FormatLabel(ColorFormat.HEX);
    this.rgbFormatLabel_ = new FormatLabel(ColorFormat.RGB);
    this.hslFormatLabel_ = new FormatLabel(ColorFormat.HSL);
    this.colorFormatLabels_ = [
      this.hexFormatLabel_,
      this.rgbFormatLabel_,
      this.hslFormatLabel_,
    ];
    this.adjustFormatLabelVisibility_();

    this.upDownIcon_ = document.createElement('span');
    this.upDownIcon_.innerHTML =
        '<svg width="6" height="8" viewBox="0 0 6 8" fill="none" ' +
        'xmlns="http://www.w3.org/2000/svg"><path d="M1.18359 ' +
        '3.18359L0.617188 2.61719L3 0.234375L5.38281 2.61719L4.81641 ' +
        '3.18359L3 1.36719L1.18359 3.18359ZM4.81641 4.81641L5.38281 ' +
        '5.38281L3 7.76562L0.617188 5.38281L1.18359 4.81641L3 ' +
        '6.63281L4.81641 4.81641Z" fill="black"/></svg>';

    this.append(...this.colorFormatLabels_, this.upDownIcon_);

    this.addEventListener('click', this.onClick_);
    this.addEventListener('mousedown', (event) => event.preventDefault());
  }

  adjustFormatLabelVisibility_() {
    this.colorFormatLabels_.forEach((colorFormatLabel) => {
      if (colorFormatLabel.colorFormat === this.currentColorFormat_) {
        colorFormatLabel.show();
      } else {
        colorFormatLabel.hide();
      }
    });
  }

  onClick_ = () => {
    if (this.currentColorFormat_ == ColorFormat.HEX) {
      this.currentColorFormat_ = ColorFormat.RGB;
    } else if (this.currentColorFormat_ == ColorFormat.RGB) {
      this.currentColorFormat_ = ColorFormat.HSL;
    } else if (this.currentColorFormat_ == ColorFormat.HSL) {
      this.currentColorFormat_ = ColorFormat.HEX;
    }
    this.adjustFormatLabelVisibility_();

    this.dispatchEvent(new CustomEvent('format-change', {
      detail: {
        colorFormat: this.currentColorFormat_
      }
    }));
  }
}
window.customElements.define('format-toggler', FormatToggler);

/**
 * FormatLabel: Label for a given color format.
 */
class FormatLabel extends HTMLElement {
  /**
   * @param {!ColorFormat} colorFormat
   */
  constructor(colorFormat) {
    super();

    this.colorFormat_ = colorFormat;
    if (colorFormat === ColorFormat.HEX) {
      this.hexChannelLabel_ = new ChannelLabel(ColorChannel.HEX);
      this.append(this.hexChannelLabel_);
    } else if (colorFormat === ColorFormat.RGB) {
      this.rChannelLabel_ = new ChannelLabel(ColorChannel.R);
      this.gChannelLabel_ = new ChannelLabel(ColorChannel.G);
      this.bChannelLabel_ = new ChannelLabel(ColorChannel.B);
      this.append(this.rChannelLabel_,
                  this.gChannelLabel_,
                  this.bChannelLabel_);
    } else if (colorFormat === ColorFormat.HSL) {
      this.hChannelLabel_ = new ChannelLabel(ColorChannel.H);
      this.sChannelLabel_ = new ChannelLabel(ColorChannel.S);
      this.lChannelLabel_ = new ChannelLabel(ColorChannel.L);
      this.append(this.hChannelLabel_,
                  this.sChannelLabel_,
                  this.lChannelLabel_);
    }
  }

  get colorFormat() {
    return this.colorFormat_;
  }

  show() {
    return this.classList.remove('hidden-format-label');
  }

  hide() {
    return this.classList.add('hidden-format-label');
  }
}
window.customElements.define('format-label', FormatLabel);

/**
 * ChannelLabel: Label for a color channel, to be used within a FormatLabel.
 */
class ChannelLabel extends HTMLElement {
  /**
   * @param {!ColorChannel} colorChannel
   */
  constructor(colorChannel) {
    super();

    if (colorChannel === ColorChannel.HEX) {
      this.textContent = 'HEX';
    } else if (colorChannel === ColorChannel.R) {
      this.textContent = 'R';
    } else if (colorChannel === ColorChannel.G) {
      this.textContent = 'G';
    } else if (colorChannel === ColorChannel.B) {
      this.textContent = 'B';
    } else if (colorChannel === ColorChannel.H) {
      this.textContent = 'H';
    } else if (colorChannel === ColorChannel.S) {
      this.textContent = 'S';
    } else if (colorChannel === ColorChannel.L) {
      this.textContent = 'L';
    }
  }
}
window.customElements.define('channel-label', ChannelLabel);

/**
 * SubmissionControls: Provides functionality to submit or discard a change.
 */
class SubmissionControls extends HTMLElement {
  /**
   * @param {function} submitCallback executed if the submit button is clicked
   * @param {function} cancelCallback executed if the cancel button is clicked
   */
  constructor(submitCallback, cancelCallback) {
    super();

    const padding = document.createElement('span');
    padding.setAttribute('id', 'submission-controls-padding');
    this.append(padding);

    this.submitButton_ = new SubmissionButton(submitCallback,
        '<svg width="14" height="10" viewBox="0 0 14 10" fill="none" ' +
        'xmlns="http://www.w3.org/2000/svg"><path d="M13.3516 ' +
        '1.35156L5 9.71094L0.648438 5.35156L1.35156 4.64844L5 ' +
        '8.28906L12.6484 0.648438L13.3516 1.35156Z" fill="black"/></svg>'
    );
    this.cancelButton_ = new SubmissionButton(cancelCallback,
        '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" ' +
        'xmlns="http://www.w3.org/2000/svg"><path d="M7.71094 7L13.1016 ' +
        '12.3984L12.3984 13.1016L7 7.71094L1.60156 13.1016L0.898438 ' +
        '12.3984L6.28906 7L0.898438 1.60156L1.60156 0.898438L7 ' +
        '6.28906L12.3984 0.898438L13.1016 1.60156L7.71094 7Z" ' +
        'fill="black"/></svg>'
    );
    this.append(this.submitButton_, this.cancelButton_);
  }
}
window.customElements.define('submission-controls', SubmissionControls);

/**
 * SubmissionButton: Button with a custom look that can be clicked for
 *                   a submission action.
 */
class SubmissionButton extends HTMLElement {
  /**
   * @param {function} clickCallback executed when the button is clicked
   * @param {string} htmlString custom look for the button
   */
  constructor(clickCallback, htmlString) {
    super();

    this.setAttribute('tabIndex', '0');
    this.innerHTML = htmlString;

    this.addEventListener('click', clickCallback);
  }
}
window.customElements.define('submission-button', SubmissionButton);