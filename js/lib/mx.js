"use strict";
/** ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== =====
 * Collection of tools that can be used to create games  with JS and HTML5 canvas
 * @author Lukasz Kaszubowski (matszach)
 * @see https://github.com/matszach
 * @version 1.3.3
 */

/** ===== ===== ===== ===== ===== ===== ===== ===== ===== =====
 * Base classes extended / used within the library
 */

/** ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== 
 * Base entity class, extended by geometry classes and by image draw classes
 */
class _Entity {

    static create(...args) {
        return new this(...args);
    }

    static creates(...args) {
        return args.map(a => new this(...a));
    }

    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.isMouseOver = false;
        this.isMouseDown = false;
        this.isMouseDrag = false;
        this.hidden = false;
        this.muted = false;
        this.animations = [];
        this._listenerAttached = true;
        this._xDragOffset = 0;
        this._yDragOffset = 0;
        this.onMouseOver = () => {};
        this.onMouseOut = () => {};
        this.onMouseDown = () => {};
        this.onMouseUp = () => {};
        this.onMouseDrag = () => {};
        this.expired = false;
        this.shadowColor = '#000000';
        this.shadowBlur = 0;
        this.shadowOffsetX = 0;
        this.shadowOffsetY = 0;
        this.hitboxPadding = 0;
    }

    distanceTo(x, y) {
        return Mx.Geo.Distance.simple(this.x, this.y, x, y);
    }

    directionTo(x, y) {
        const dx = x - this.x;
        const dy = y - this.y;
        let phi; 
        if(dx === 0) {
            phi = dy > 0 ? Math.PI/2 : Math.PI/2 * 3;
        } else {
            phi = Math.atan(dy/dx);
            if (dx < 0) {
                phi += Math.PI;
            }
        }
        return phi;
    }

    directionToCursor() {
        const {xInCanvas, yInCanvas} = Mx.Input.mouse();
        return this.directionTo(xInCanvas, yInCanvas);
    }

    expire() {
        this.expired = true;
        return this;
    }

    setHitboxPadding(padding = 0) {
        this.hitboxPadding = padding;
        return this;
    }

    setShadow(color = '#000000', blur = 0, offsetX = 0, offsetY = 0) {
        this.shadowColor = color;
        this.shadowBlur = blur;
        this.shadowOffsetX = offsetX;
        this.shadowOffsetY = offsetY;
        return this;
    }

    resetShadow() {
        this.shadowColor = '#000000';
        this.shadowBlur = 0;
        this.shadowOffsetX = 0;
        this.shadowOffsetY = 0;
        return this;
    }

    travel() {
        return this.move(this.vx, this.vy);
    }

    accelerate(ax, ay) {
        this.vx += ax;
        this.vy += ay;
        return this;
    }

    acceleratePolar(aphi, ar) {
        const {x, y} = Mx.Geo.toCartesian(aphi, ar);
        this.accelerate(x, y);
        return this;
    }

    traction(fraction = 0.99) {
        this.vx *= fraction;
        this.vy *= fraction;
        return this;
    }

    stop() {
        this.vx = 0;
        this.vy = 0;
        return this;
    }

    capVelocity(maxX, maxY, minX = -maxX, minY = -maxY) {
        if (this.vx > maxX) {
            this.vx = maxX;
        } else if (this.vx < minX) {
            this.vx = minX;
        } else if (this.vy > maxY) {
            this.vy = maxY;
        } else if (this.vy < minY) {
            this.vy = minY;
        }
        return this;
    }

    centerOn(x, y) {
        const {x: cx, y: cy} = this.getCenter();
        this.move(x - cx, y - cy);
        return this;
    }

    mute() {
        this.muted = true;
        return this;
    }

    unmute() {
        this.muted = false;
        return this;
    }

    hide() {
        this.hidden = true;
        return this;   
    }

    show() {
        this.hidden = false;
        return this;
    }

    place(x, y) {
        this.x = x;
        this.y = y;    
        return this;       
    }

    move(x, y) {
        this.x += x;
        this.y += y;
        return this;
    }

    easeTo(x, y, ratio = 0.1) {
        const dx = x - this.x;
        const dy = y - this.y;
        this.move(dx * ratio, dy * ratio);
        return this;
    }

    movePolar(phi, r) {
        const {x, y} = Mx.Geo.toCartesian(phi, r);
        return this.move(x, y);
    }
    
    scale(scaleX = 1, scaleY = scaleX, xOrigin = this.x, yOrigin = this.y) {
        this.x = scaleX * (this.x - xOrigin) + xOrigin;
        this.y = scaleY * (this.y - yOrigin) + yOrigin;
        return this;
    }

    rotate(phi, xOrigin = this.x, yOrigin = this.y) {
        const r = Mx.Geo.Distance.simple(xOrigin, yOrigin, this.x, this.y);
        const pCrd = Mx.Geo.toPolar(this.x - xOrigin, this.y - yOrigin);
        const cCrd = Mx.Geo.toCartesian(phi + pCrd.phi, r);
        this.place(cCrd.x + xOrigin, cCrd.y + yOrigin);
        return this;
    }

    _canBeDrawn(canvasHandler) {
        // abstract TODO, shoulsd return false when entity out of canvas draw range
        return true;
    }

    _getDrawn(canvasHandler) {
        // abstract
    }

    isPointOver(x, y) {
        // abstract
        return false;
    }

    listen() {
        if(!this._listenerAttached || this.muted) {
            return this;
        }
        // setup
        const mouse = Mx.Input.mouse();
        const isNowMouseOver = this.isPointOver(mouse.xInCanvas, mouse.yInCanvas);
        const isNowMouseDown = mouse.left;
        // mouse over
        if(isNowMouseOver) {
            if(!this.isMouseOver) {
                this.onMouseOver(mouse, this);
            }
            this.isMouseOver = true;
        } else {
            if(this.isMouseOver) {
                this.onMouseOut(mouse, this);
                this.isMouseOver = false;
            }
        } 
        // mouse down 
        if(isNowMouseDown) {
            if(!this.isMouseDown) {
                if(isNowMouseOver) {
                    this.onMouseDown(mouse, this);
                    this.isMouseDown = true;
                }
            } else {
                if(mouse.draggedEntity === null) {
                    mouse.draggedEntity = this;
                }
                if(mouse.draggedEntity === this) {
                    this.onMouseDrag(mouse, this);
                }
            }
        } else {
            if(this.isMouseDown) {
                this.onMouseUp(mouse, this);
                this.isMouseDown = false;
                mouse.draggedEntity = null;
            }
        }
        // fin
        return this;
    }

    on(event, callback = () => {}) {
        this._listenerAttached = true;
        switch(event) {
            case 'over': this.onMouseOver = callback; break;
            case 'out': this.onMouseOut = callback; break;
            case 'down': this.onMouseDown = callback; break;
            case 'up': this.onMouseUp = callback; break;
            case 'drag': this.onMouseDrag = callback; break;
            default: break;
        }
        return this;
    }

    clearListeners() {
        this.onMouseOver = () => {};
        this.onMouseOut = () => {};
        this.onMouseDown = () => {};
        this.onMouseUp = () => {};
        this.onMouseDrag = () => {};
        return this;
    }

    enableDrag() {
        return this.on('down', (mouse, e) => {
            const {x, y} = e.getCenter();
            e._xDragHook = mouse.xInCanvas - x;
            e._yDragHook = mouse.yInCanvas - y;
        }).on('drag', (mouse, e) => {
            e.place(mouse.xInCanvas - e._xDragHook, mouse.yInCanvas - e._yDragHook);
        });
    }

    addAnimation(animation) {
        animation.onStart(this);
        this.animations.push(animation);
        return this;
    }

    addAnimations(animations) {
        for(let a of animations) {
            this.addAnimation(a);
        }
        return this;
    }

    clearAnimations() {
        this.animations.forEach(a => a.onFinish(this), this);
        this.animations = [];
        return this;
    }

    setAnimation(animation) {
        this.animations = [animation];
        return this;
    }

    animate() {
        if(this.animations.length === 0) {
            return;
        }
        let finishedAnimationPresent = false;
        this.animations.forEach(a => {
            a.doFrame(this);
            if(a.finished) {
                finishedAnimationPresent = true;
            }
        }, this);
        if(finishedAnimationPresent) {
            this.animations = this.animations.filter(a => {
                if(a.finished) {
                    a.onFinish(this);
                    return false;
                }
                return true;
            });
        }
        return this;
    }

    clone() {
        // abstract
    }

    getBoundingRectangle(padding = this.hitboxPadding, backgroundColor = undefined, borderColor = 'red', borderThickness = 1) {
        return Mx.Geo.Rectangle.create(
            this.x - padding, this.y - padding, 
            padding * 2, padding * 2,
            backgroundColor, borderColor, borderThickness
        );     
    }

    getBoundingCircle(padding = this.hitboxPadding, backgroundColor = undefined, borderColor = 'red', borderThickness = 1) {
        return Mx.Geo.Circle.create(
            this.x, this.y, padding, 
            backgroundColor, borderColor, borderThickness
        );
    }

    getMovementVector(scale = 10, color = 'red', thickness = 1) {
        const x2 = this.x + this.vx * scale;
        const y2 = this.y + this.vy * scale;
        return new Mx.Geo.Line(this.x, this.y, x2, y2, color, thickness);
    }


    getCenter() {
        return new Mx.Geo.Vertex(this.x, this.y);
    }

    snapToGrid(gridX = 16, gridY = 16, offsetX = 0, offsetY = 0) {
        const dx = (this.x + offsetX) % gridX;
        const dy = (this.y + offsetY) % gridY;
        this.move(-dx, -dy);
        return this;
    }

    update() {
        // abstract
    }

}

/** ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== 
 * Base gui component class, extended by gui classes and by image draw classes
 */
class _GuiComponent extends _Entity {

    constructor(x = 0, y = 0, options = {}) {
        super(x, y);
        this.options = options;
        this.container = Mx.Container.create(x, y);
        this.construct();
        const c = this.getCenter();
        this.x = c.x;
        this.y = c.y;
    }   

    // constructs the components by adding elements to the _container
    construct() {
        // abstract
    }

    hide() {
        this.container.hide();
        return this;   
    }

    show() {
        this.container.show();
        return this;
    }

    place(x, y) {
        this.container.place(x, y);    
        this.x = this.container.x;
        this.y = this.container.y;
        return this;       
    }

    move(x, y) {
        this.container.move(x, y);
        this.x = this.container.x;
        this.y = this.container.y;
        return this;
    }

    easeTo(x, y, ratio = 0.1) {
        this.container.easeTo(x, y, ratio);
        this.x = this.container.x;
        this.y = this.container.y;
        return this;
    }

    movePolar(phi, r) {
        this.container.movePolar(phi, r);
        this.x = this.container.x;
        this.y = this.container.y;
        return this;
    }
    
    scale(scaleX = 1, scaleY = scaleX, xOrigin = undefined, yOrigin = undefined) {
        this.container.scale(scaleX, scaleY, xOrigin, yOrigin);
        return this;
    }

    rotate(phi, xOrigin = this.x, yOrigin = this.y) {
        this.container.rotate(phi, xOrigin, yOrigin);
        return this;
    }

    _getDrawn(canvasHandler) {
        this.container._getDrawn(canvasHandler);
        return this;
    }

    isPointOver(x, y) {
        return this.container.isPointOver(x, y); // should be overriden
    }

    getBoundingRectangle(padding = this.hitboxPadding, backgroundColor = undefined, borderColor = 'red', borderThickness = 1) {
        return this.container.getBoundingRectangle(padding, backgroundColor, borderColor, borderThickness); // should be overriden
    }

    getBoundingCircle(padding = this.hitboxPadding, backgroundColor = undefined, borderColor = 'red', borderThickness = 1) {
        return this.container.getBoundingCircle(padding, backgroundColor, borderColor, borderThickness); // should be overriden
    }

    getCenter() {
        return this.container.getCenter();
    }

    clone() {
        return _GuiComponent.create(this.x, this.y, this.options);
    }

}

/** ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== 
 * Base entity animation class
 */
class _Animation {

    static create(...args) {
        return new this(...args);
    }

    constructor(maxDuration = 60) {
        this.finished = false;
        this.currentDuration = 0;
        this.maxDuration = maxDuration;
    }

    tick() {
        this.currentDuration ++;
        if(this.currentDuration >= this.maxDuration) {
            this.finished = true;
        }
    }

    doFrame(entity) {
       this.tick();
       this.onFrame(entity);
    }

    onStart(entity) {
        // abstract
    }

    onFrame(entity) {
        // abstarct
    }

    onFinish(entity) {
        // abstract
    }

}


/** ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== 
 * ImageDataManager submodule for CanvasHandler
 */
class _PixImageDataManager {

    constructor(context, canvas, alphaBlend = true) {
        this.context = context;
        this.canvas = canvas;
        this._alphaBlend = alphaBlend;
        this._blendPixelData = () => {};
        this._initAlphaBlend();
    }

    _initAlphaBlend() {
        if(this._alphaBlend) {
            this.enableAlphaBlend();
        } else {
            this.disableAlphaBlend();
        }
    }

    disableAlphaBlend() {
        this._alphaBlend = false;
        this._blendPixelData = (i, r, g, b, a) => {
            this.imageDataArray[i] = r;
            this.imageDataArray[i + 1] = g;
            this.imageDataArray[i + 2] = b;
        };
        return this;
    }
    
    enableAlphaBlend() {
        this._alphaBlend = true;
        this._blendPixelData = (i, r, g, b, a) => {
            const blend = a / 255;
            const oBlend = (1 - blend);
            this.imageDataArray[i] = Math.round(r * blend + this.imageDataArray[i] * oBlend);
            this.imageDataArray[i + 1] = Math.round(g * blend + this.imageDataArray[i + 1] * oBlend);
            this.imageDataArray[i + 2] = Math.round(b * blend + this.imageDataArray[i + 2] * oBlend);
        };
        return this;
    }

    isAlphaBlend() {
        return this._alphaBlend;
    }

    enableRefitOnResize() {
        this.refitOnResize = true;
        this._attachResizeListeners();
        return this;
    }

    // ================================ LIFECYCLE METHODS ===============================
    initImageData(width = this.canvas.width, height = this.canvas.height) {
        this.imageDataWidth = width;
        this.imageDataHeight = height;
        this.imageData = this.context.createImageData(this.imageDataWidth, this.imageDataHeight);
        this.imageDataArray = this.imageData.data;
        for(let i = 3; i < this.imageDataArray.length; i += 4) {
            this.imageDataArray[i] = 255;
        }
    }

    fill(r = 0, g = 0, b = 0, a = 255) {
        for(let i = 0; i < this.imageDataArray.length; i += 4) {
            this._blendPixelData(i, r, g, b, a);
        }
    }

    clear(r = 0, g = 0, b = 0) {
        for(let i = 0; i < this.imageDataArray.length; i += 4) {
            this.imageDataArray[i] = r;
            this.imageDataArray[i + 1] = g;
            this.imageDataArray[i + 2] = b;
        }
    }

    getPixel(x, y) {
        const i = (y * this.imageDataWidth + x) * 4;
        return this.imageDataArray.slice(i - 1, i + 2);
    }

    putPixel(x, y, r = 0, g = 0, b = 0, a = 255) {
        const i = (y * this.imageDataWidth + x) * 4;
        this._blendPixelData(i, r, g, b, a);
    }

    putRectangle(x, y, width, height, r = 0, g = 0, b = 0, a = 255) {
        x = Math.round(x);
        y = Math.round(y);
        for(let xi = x; xi < x + width; xi++) {
            for(let yi = y; yi < y + height; yi++) {
                this.putPixel(xi, yi, r, g, b, a);
            }
        }
    }

    putBox(x, y, width, height, thickness = 1, r = 0, g = 0, b = 0, a = 255) {
        x = Math.round(x);
        y = Math.round(y);
        thickness = Math.round(thickness);
        const hThick = Math.round(thickness/2);
        this.putRectangle(x - hThick, y - hThick, width + thickness, thickness, r, g, b, a);
        this.putRectangle(x - hThick, y + hThick, thickness, height - thickness, r, g, b, a);
        this.putRectangle(x - hThick + width, y + hThick, thickness, height - thickness, r, g, b, a);
        this.putRectangle(x - hThick, y - hThick + height, width + thickness, thickness, r, g, b, a);
    }

    putCircle(x, y, radius, r = 0, g = 0, b = 0, a = 255) {
        x = Math.round(x);
        y = Math.round(y);
        radius = Math.round(radius);
        for(let xi = x - radius; xi < x + radius + 1; xi++) {
            for(let yi = y - radius; yi < y + radius + 1; yi++) {
                if((x - xi)**2 + (y - yi)**2 < radius**2) {
                    this.putPixel(xi, yi, r, g, b, a);
                }
            }
        }
    }
    
    putRing(x, y, radius, thickness = 1, r = 0, g = 0, b = 0, a = 255) {
        x = Math.round(x);
        y = Math.round(y);
        radius = Math.round(radius);
        thickness = Math.round(thickness);
        const radIn = radius - thickness/2;
        const radOut = radius + thickness/2;
        for(let xi = x - radOut; xi < x + radOut + 1; xi++) {
            for(let yi = y - radOut; yi < y + radOut + 1; yi++) {
                const sq = (x - xi)**2 + (y - yi)**2;
                if(sq < radOut**2 && sq > radIn**2) {
                    this.putPixel(xi, yi, r, g, b, a);
                }
            }
        }
    }

    putLine(x1, y1, x2, y2, thickness = 1, r = 0, g = 0, b = 0, a = 255) {
        x1 = Math.round(x1);
        y1 = Math.round(y1);
        x2 = Math.round(x2);
        y2 = Math.round(y2);
        thickness = Math.round(thickness);
        const absX = Math.abs(x1 - x2);
        const absY = Math.abs(y1 - y2);
        if(absX > absY) {
            const yStep = (y2 - y1) / absX;
            let currY = y1;
            if(x1 < x2) {
                for(let x = x1; x < x2; x++) {
                    const minY = Math.floor(currY - thickness/2);
                    const maxY = Math.ceil(currY + thickness/2)
                    for(let y = minY; y < maxY; y++) {
                        this.putPixel(x, y, r, g, b, a);
                    } 
                    currY += yStep;
                }
            } else {
                for(let x = x1; x > x2; x--) {
                    const minY = Math.floor(currY - thickness/2);
                    const maxY = Math.ceil(currY + thickness/2)
                    for(let y = minY; y < maxY; y++) {
                        this.putPixel(x, y, r, g, b, a);
                    } 
                    currY += yStep;
                }
            }
        } else {
            const xStep = (x2 - x1) / absY;
            let currX = x1;
            if(y1 < y2) {
                for(let y = y1; y < y2; y++) {
                    const minX = Math.floor(currX - thickness/2);
                    const maxX = Math.ceil(currX + thickness/2)
                    for(let x = minX; x < maxX; x++) {
                        this.putPixel(x, y, r, g, b, a);
                    } 
                    currX += xStep;
                }
            } else {
                for(let y = y1; y > y2; y--) {
                    const minX = Math.floor(currX - thickness/2);
                    const maxX = Math.ceil(currX + thickness/2)
                    for(let x = minX; x < maxX; x++) {
                        this.putPixel(x, y, r, g, b, a);
                    } 
                    currX += xStep;
                }
            } 
        }
    }

    putPolyline(points, thickness = 1, r = 0, g = 0, b = 0, a = 255) {
        for(let i = 0; i < points.length; i += 2) {
            this.putLine(points[i], points[i + 1], points[i + 2], points[i + 3], thickness, r, g, b, a);
        }
    }

    displayImageData(x = 0, y = 0) {
        this.context.putImageData(this.imageData, x, y);
    }

}

/** ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== 
 * Postprocessing submodule for CanvasHandler
 */
class _CanvasHandlerPostProcessor {

    constructor(handler) {
        this.handler = handler;
        this.canvas = handler.canvas;
        this.context = handler.context;
    } 

    pixelate(pixelSize = 2) {
        const wasImageSmoothing = this.context.msImageSmoothingEnabled;
        this.handler.setImageSmoothing(false);
        const w = this.canvas.width / pixelSize;
        const h = this.canvas.height / pixelSize;
        this.context.resetTransform();
        this.context.drawImage(
            this.canvas, 
            0, 0, this.canvas.width, this.canvas.height,
            0, 0, w, h
        );
        this.context.drawImage(
            this.canvas, 
            0, 0, w, h,
            0, 0, this.canvas.width, this.canvas.height
        );
        this.context.translate(this.handler.vpX, this.handler.vpY);
        this.context.scale(this.handler.vpScale, this.handler.vpScale);
        if(!wasImageSmoothing) {
            this.handler.setImageSmoothing(true);
        }
    }

    invert() {
        const imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        for(let i = 0; i < data.length; i += 4) {
            data[i] = 255 - data[i];
            data[i + 1] = 255 - data[i + 1];
            data[i + 2] = 255 - data[i + 2];
        }
        this.context.putImageData(imageData, 0, 0);
    }

    grayscale() {
        const imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        for(let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2])/3
            data[i] = avg;
            data[i + 1] = avg;
            data[i + 2] = avg;
        }
        this.context.putImageData(imageData, 0, 0);
    }

    watercolor(step = 20) {
        const imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        for(let i = 0; i < data.length; i += 4) {
            data[i] = data[i] - data[i] % step;
            data[i + 1] = data[i + 1] - data[i + 1] % step;
            data[i + 2] = data[i + 2] - data[i + 2] % step;
        }
        this.context.putImageData(imageData, 0, 0);
    }

    generic(funct = (r, g, b, a, imgData, i) => [r, g, b, a]) {
        const imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        for(let i = 0; i < data.length; i += 4) {
            const info = funct(data[i], data[i + 1], data[i + 2], data[i + 3], data, i);
            data[i] = info[0];
            data[i + 1] = info[1];
            data[i + 2] = info[2];
            data[i + 3] = info[3];
        }
        this.context.putImageData(imageData, 0, 0);
    }
    
}

/** ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== 
 * Library body proper
 */
const Mx = {

    /**
     * Initializes a simplified app
     * @param {*} update 
     * @deprecated
     */
    simpleInit(update) {
        const handler = Mx.Draw.CanvasHandler.create();
        const input = Mx.Input.init(handler);
        const rng = Mx.Rng.init();
        Mx.It.Loop.start(60, loop => update(handler, rng, input, loop));
    },

    /** ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== 
     * Assigned here for public access
     */
    Entity: _Entity,

    /** ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== 
     * Entity that can contain other entities
     */
    Container: class extends _Entity {

        static of(elements) {
            const cont = Mx.Container.create();
            cont.adds(...elements);
            return cont;
        }

        constructor(x = 0, y = 0) {
            super(x, y);
            this.children = [];
        }

        add(entity) {
            this.children.push(entity);
            const {x, y} = this.getCenter();
            this.x = x;
            this.y = y;
            return this;
        }

        adds(...entities) {
            for(let e of entities) {
                this.children.push(e);
            }
            const {x, y} = this.getCenter();
            this.x = x;
            this.y = y;
            return this;
        }

        forChild(callback) {
            for(let i = 0; i < this.children.length; i++) {
                callback(this.children[i], i);
            }
            return this;
        }

        forChildBackwards(callback) {
            for(let i = this.children.length - 1; i >= 0; i--) {
                callback(this.children[i], i);
            }
            return this;
        }

        place(x, y) {
            const c = this.getCenter();
            this.x = c.x;
            this.y = c.y; 
            const dx = x - this.x;
            const dy = y - this.y;
            this.x = x;
            this.y = y;
            this.forChild(c => c.move(dx, dy));
        }
    
        move(x, y) {
            super.move(x, y);
            this.forChild(c => c.move(x, y));
            return this;
        }
        
        scale(scaleX = 1, scaleY = scaleX, xOrigin = this.x, yOrigin = this.y) {
            super.scale(scaleX, scaleY, xOrigin, yOrigin);
            this.forChild(c => c.scale(scaleX, scaleY, xOrigin, yOrigin));
            return this;
        }
    
        rotate(phi, xOrigin = this.x, yOrigin = this.y) {
            super.rotate(phi, xOrigin, yOrigin);
            this.forChild(c => c.rotate(phi, this.x, this.y));
            return this;
        }
    
	    _getDrawn(canvasHandler) {
            if(!this.hidden) {
                this.forChild(c => {
                    if(!c.hidden) {
                        canvasHandler.draw(c);
                    }
                });
            }
        }

        listen() {
            if(!this.muted) {
                this.forChildBackwards(c => c.listen());
                super.listen();
            }
            return this;
        }

        clone() {
            const cont = Mx.Container.create(this.x, this.y);
            this.forChild(c => cont.add(c.clone()));
            return cont;
        }

        isPointOver(x, y) {
            return this.getBoundingRectangle().isPointOver(x, y);
        }

        getBoundingRectangle(padding = this.hitboxPadding, backgroundColor = undefined, borderColor = 'red', borderThickness = 1) {
            const initialChildRect = (this.children[0] || new Mx.Geo.Rectangle(this.x, this.y, 0, 0)).getBoundingRectangle();
            let minX = initialChildRect.x;
            let minY = initialChildRect.y;
            let maxX = initialChildRect.x + initialChildRect.width;
            let maxY = initialChildRect.y + initialChildRect.height;
            for(let child of this.children.slice(1)) {
                const {x, y, width, height} = child.getBoundingRectangle();
                if(x + width > maxX) maxX = x + width;
                if(y + height > maxY) maxY = y + height;
                if(x < minX) minX = x;
                if(y < minY) minY = y;
            }
            return Mx.Geo.Rectangle.create(
                minX - padding, minY - padding,
                maxX - minX + 2 * padding, maxY - minY + 2 * padding, 
                backgroundColor, borderColor, borderThickness
            );
        }
    
        getBoundingCircle(padding = this.hitboxPadding, backgroundColor = undefined, borderColor = 'red', borderThickness = 1) {
            // FIXME this requires more work
            return this.getBoundingRectangle().getBoundingCircle(padding, backgroundColor, borderColor, borderThickness);
        }

        getCenter() {
            let x = 0;
            let y = 0;
            for(let child of this.children) {
                const c = child.getCenter();
                x += c.x;
                y += c.y;
            }
            x /= this.children.length;
            y /= this.children.length;
            return Mx.Geo.Vertex.create(x, y);
        }

        animate() {
            super.animate();
            this.forChild(c => c.animate());
            return this;
        }
        
        travel() {
            super.travel();
            this.forChild(c => c.travel());
            return this;
        }

        update() {
            super.update();
            this.forChild(c => c.update());
            return this;
        }
    
    },

    /** ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== 
     * Text entity
     */
    Text: class extends _Entity {

        constructor(x, y, content = 'Text', color = 'black', fontSize = '12', fontFamily = 'Arial monospaced', rotation = 0, alpha = 1, align = 'start') {
            super(x, y);
            this.content = content;
            this.color = color;
            this.fontSize = fontSize;
            this.fontFamily = fontFamily;
            this.rotation = rotation;
            this.alpha = alpha;
            this.align = align;
            this.characterWidthRatio = 0.44;
            this.characterHeightRatio = 0.85;
        }

        _getDrawn(canvasHandler) {
            canvasHandler.write(
                this.x, this.y, this.content, this.color, 
                this.fontSize, this.fontFamily, this.rotation, 
                this.alpha, this.align
            );
        }

        // FIXME not perfect but somewhat works for now
        getBoundingRectangle(backgroundColor = undefined, borderColor = 'red', borderThickness = 1) {
            const rotationOffset = Math.sin(this.rotation) * this.fontSize * 0.5;
            const x1 = this.x;
            const y1 = this.y - this.fontSize * this.characterHeightRatio + rotationOffset;
            const r = this.fontSize * this.characterWidthRatio * this.content.length;
            const {x: dx, y: dy} = Mx.Geo.toCartesian(this.rotation, r);
            const x2 = x1 + dx + rotationOffset;
            const y2 = y1 + dy + this.fontSize - rotationOffset;
            let x = x1 < x2 ? x1 : x2;
            let y = y1 < y2 ? y1 : y2;
            const width = Math.abs(x1 - x2);
            const height = Math.abs(y1 - y2);
            if (this.align === 'center') {
                x -= width/2;
            } else if (this.align === 'end') {
                x -= width;
            }
            return new Mx.Geo.Rectangle(x, y, width, height, backgroundColor, borderColor, borderThickness);
        }

        isPointOver(x, y) {
            return this.getBoundingRectangle().isPointOver(x, y);
        }

        clone() {
            return Mx.Text.create(
                this.x, this.y,
                this.content, this.color, this.fontSize, this.fontFamily,
                this.rotation, this.alpha, this.align
            );
        }

    },

    /** ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== 
     * Sprite sheet (~Sprite entity factory) / Spirte 
     */
    SpriteSheet: class {

        static create(src, spriteSizeX, spriteSizeY, borderThickness, innerScale) {
            return new Mx.SpriteSheet(src, spriteSizeX, spriteSizeY, borderThickness, innerScale);
        }

        constructor(src, spriteSizeX = 32, spriteSizeY = 32, borderThickness = 0, innerScale = 1) {
            this.img = new Image();
            this.img.src = src;
            this.spriteWidth = spriteSizeX * innerScale;
            this.spriteHeight = spriteSizeY * innerScale;
            this.borderThickness = borderThickness * innerScale;
        }

        get(x, y) {
            return new Mx.Sprite(
                this, 0, 0, this.img,
                this.spriteWidth, this.spriteHeight, this.borderThickness,
                x, y
            );
        }
    },

    Sprite: class extends _Entity {

        static from(sheet, x = 0, y = 0) {
            return sheet.get(x, y);
        }

        constructor(
            sheet, 
            x, y, image, spriteWidth = 32, spriteHeight = 32, borderThickness = 0, 
            frameX = 0, frameY = 0, drawnWidth = spriteWidth, drawnHeight = spriteHeight,
            rotation = 0, alpha = 1, mirrored = false,
        ) {
            super(x, y);
            this.sheet = sheet;
            this.image = image;
            this.spriteWidth = spriteWidth;
            this.spriteHeight = spriteHeight;
            this.borderThickness = borderThickness;
            this.frameX = frameX;
            this.frameY = frameY;
            this.drawnWidth = drawnWidth;
            this.drawnHeight = drawnHeight;
            this.rotation = rotation;
            this.alpha = alpha;
            this.mirrored = mirrored;
        }
        
        flip() {
            this.mirrored = !this.mirrored;
            return this;
        }

        scale(scaleX = 1, scaleY = scaleX, xOrigin = this.x, yOrigin = this.y) {
            super.scale(scaleX, scaleY, xOrigin, yOrigin);
            this.drawnWidth *= scaleX;
            this.drawnHeight *= scaleY;
            return this;
        }

        setDrawnSize(width, height = width) {
            this.drawnWidth = width;
            this.drawnHeight = height;
            return this;
        }

        setFrame(x, y) {
            this.frameX = x;
            this.frameY = y;
            return this;
        }

        setAlpha(alpha) {
            this.alpha = alpha;
            return this;
        }

        setRotation(rotation) {
            this.rotation = rotation;
            return this;
        }

        rotate(phi, xOrigin = this.x, yOrigin = this.y) {
            super.rotate(phi, xOrigin, yOrigin);
            this.rotation += phi;
            return this;
        }

        _getDrawn(canvasHandler) {
            canvasHandler.drawSprite(
                this.x, this.y, this.image, 
                this.frameX * (this.spriteWidth + this.borderThickness),
                this.frameY * (this.spriteHeight + this.borderThickness),
                this.spriteWidth, this.spriteHeight, this.drawnWidth, this.drawnHeight,
                this.rotation, this.alpha, this.mirrored
            );
        }

        isPointOver(x, y) {
            return this.getBoundingRectangle().isPointOver(x, y);
        }

        clone() {
            return Mx.Sprite.create(
                this.x, this.y, 
                this.image, this.spriteWidth, this.spriteHeight, this.borderThickness, 
                this.frameX, this.frameY, this.drawnWidth, this.drawnHeight,
                this.rotation, this.alpha
            );
        }

        getBoundingRectangle(padding = this.hitboxPadding, backgroundColor = undefined, borderColor = 'red', borderThickness = 1) {
            return Mx.Geo.Rectangle.create(
                this.x - this.drawnWidth/2 - padding, this.y - this.drawnHeight/2 - padding,
                this.drawnWidth + padding * 2, this.drawnHeight + padding * 2,
                backgroundColor, borderColor, borderThickness
            );
        }
    
        getBoundingCircle(padding = this.hitboxPadding, backgroundColor = undefined, borderColor = 'red', borderThickness = 1) {
            return Mx.Geo.Circle.create(
                this.x, this.y, Math.max(this.drawnHeight, this.drawnWidth)/2 + padding,
                backgroundColor, borderColor, borderThickness
            );
        }

    },

    /** ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== 
     * Animations
     */
    Animations:  {
        
        Animation: _Animation,

        Sequence: class extends _Animation {

            static from(...animationInfo) {
                return Mx.Animations.Sequence.create(
                    ...animationInfo.map(a => {
                        const [type, ...args] = a;
                        return Mx.Animations[type].create(...args)
                    })
                );
            }
            
            constructor(...animations) {
                super(animations.reduce((acc, curr) => acc + curr.maxDuration + 1, 0));
                this.animations = animations;
                this.currentAnimationIndex = 0;
            }

            onStart(entity) {
                this.animations[this.currentAnimationIndex].onStart(entity);
            }

            onFrame(entity) {
                const animation = this.animations[this.currentAnimationIndex];
                animation.doFrame(entity);
                if(animation.finished) {
                    animation.onFinish(entity);
                    this.currentAnimationIndex++;
                    if(this.currentAnimationIndex >= this.animations.length) {
                        this.finished = true;
                    } else {
                        this.animations[this.currentAnimationIndex].onStart(entity)
                    }
                }
            }

        },

        combine(...animationInfo) {
            return animationInfo.map(a => {
                const [type, ...args] = a;
                return Mx.Animations[type].create(...args)
            });
        },

        Wait: class extends _Animation { 
            // no overriding needed
        },

        Ease: class extends _Animation {

            constructor(targetX, targetY, ratio = 0.1, maxDuration = 120) {
                super(maxDuration);
                this.targetX = targetX;
                this.targetY = targetY;
                this.ratio = ratio;
            }

            onFrame(entity) {
                entity.easeTo(this.targetX, this.targetY, this.ratio);
                if(Math.abs(this.targetY - entity.y) < 0.1 && Math.abs(this.targetX - entity.x) < 0.1) {
                    entity.move(this.targetX - entity.x, this.targetY - entity.y);
                    this.finished = true;
                }
            }

        },

        Move: class extends _Animation {
        
            constructor(dx, dy, maxDuration = 60) {
                super(maxDuration);
                this.sx = dx/maxDuration;
                this.sy = dy/maxDuration;
            }

            onFrame(entity) {
                entity.move(this.sx, this.sy);
            }

        },

        SmoothStart: class extends _Animation {

            constructor(dx, dy, power = 2, maxDuration = 60) {
                super(maxDuration);
                this.dx = dx;
                this.dy = dy;
                this.power = power;
            }

            onFrame(entity) {
                const t1 = (this.currentDuration - 1)/this.maxDuration;
                const t2 = this.currentDuration/this.maxDuration;
                const fract = t2 ** this.power - t1 ** this.power;
                entity.move(this.dx * fract, this.dy * fract);
            } 

        },

        SmoothStop: class extends _Animation {

            constructor(dx, dy, power = 2, maxDuration = 60) {
                super(maxDuration);
                this.dx = dx;
                this.dy = dy;
                this.power = power;
            }

            onFrame(entity) {
                const t1 = (this.currentDuration - 1)/this.maxDuration;
                const t2 = this.currentDuration/this.maxDuration;
                const fract = (1 - t1) ** this.power - (1 - t2) ** this.power;
                entity.move(this.dx * fract, this.dy * fract);
            } 

        },

        Sin: class extends _Animation {

            constructor(dx, dy, rad = Math.PI, maxDuration = 60) {
                super(maxDuration);
                this.dx = dx;
                this.dy = dy;
                this.rad = rad;
            }

            onFrame(entity) {
                const t1 = (this.currentDuration - 1)/this.maxDuration;
                const t2 = this.currentDuration/this.maxDuration;
                const fract = Math.sin(t2 * this.rad) - Math.sin(t1 * this.rad)
                entity.move(this.dx * fract, this.dy * fract);
            } 

        }


    },
    

    /** ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== 
     * Random number generator
     */
    Rng: class {
        
        static _MIN_CHAR_CODE = 33;
        static _MAX_CHAR_CODE = 127;

        static _transformSeed(seed) {
            if(!isNaN(seed)) {
                return seed;
            }
            const stringified = JSON.stringify(seed);
            const split = stringified.split('');
            const reduced = split.reduce((acc, curr, index) => acc + (curr.charCodeAt(0) - Mx.Rng._MIN_CHAR_CODE) * (index + 1), 0);
            const absolute = Math.abs(reduced);
            return absolute;
        }

        static create(seed, args = {}) {
            return new Mx.Rng(seed, args);
        }

        /**
         * @deprecated
         */
        static init(seed, args = {}) {
            return Mx.Rng.create(seed, args);
        }

        /**
         * Creates an Rng instance that uses the Math's random() as a value generator
         * @returns {Mx.Rng} a new Rng instance
         */
        static fromMathRandom() {
            const rng = new Mx.Rng();
            rng._random = Math.random;
            return rng;
        }

        /**
         * Constructs a new instance of the random number generator
         * @param {any} seed - seed for random number generator
         * @param {any} args - TODO
         */
        constructor(seed) {
            this.seed = seed || this._generateRandomSeed();
            this.state = Mx.Rng._transformSeed(this.seed);
        }

        reseed(seed) {
            this.seed = seed || this._generateRandomSeed();
            this.state = Mx.Rng._transformSeed(this.seed);
            return this;
        }

        setState(newState) {
            this.state = newState;
            return this;
        }
        
        _generateRandomSeed() {
            let seed = '';
            for(let i = 0; i < 20; i++) {
                const charCode = Math.floor(Math.random() * (Mx.Rng._MAX_CHAR_CODE - Mx.Rng._MIN_CHAR_CODE) + Mx.Rng._MIN_CHAR_CODE);
                seed += String.fromCharCode(charCode)
            }
            return seed;
        }

        _random() {
            this.state += 0xe120fc15;
            let temp = this.state * 0x4a39b70d;
            const m1 = (temp >> 1) ^ temp;
            temp = m1 * 0x12fad5c9;
            const m2 = (temp >> 1) ^ temp;
            return m2 % 100000 / 100000;
        }

        /**
         * Generates a random float between 0 (incl.) and 1 (excl.)
         * @returns {number} a float between 0 and 1
         */
        fract() {
            return this._random();
        }

        /**
         * Generates a random float between min (incl.) and max (excl.)
         * @param {number} min - min value
         * @param {number} max - max value
         * @returns a float between min and max
         */
        float(min, max) {
            return this._random() * (max - min) + min;
        }

        /**
         * Generates a random int between min (incl.) and max (excl.)
         * @param {number} min - min value
         * @param {number} max - max value
         * @returns an int between min and max
         */
        int(min, max) {
            return Math.floor(this.float(min, max));
        }

        /**
         * Returns a random entry from a given array
         * @param {Array<K>} options - possible values to choose from
         * @returns {K} - the seleted entry
         */
        choice(options) {
            return options[this.int(0, options.length)];
        }

        choices(options, n, unique) {
            const choices = [];
            while (choices.length < n) {
                const c = this.choice(options);
                if(unique && choices.includes(c)) {
                    continue;
                }
                choices.push(c);
            }
            return choices;
        }


        /**
         * TODO
         * @param {*} chance 
         * @returns 
         */
        chance(chance) {
            return this._random() < chance;
        }

        /**
         * TODO
         * @returns 
         */
        bool() {
            return this._random() > 0.5;
        }

        sign() {
            return this.bool() ? 1 : -1;
        }

        /**
         * Returns a random entry from a given array while using the weights array 
         * @param {Array<K>} options - possible values to choose from
         * @param {Array<number>} weights - array of weights for each of the options
         * @returns {K} - the seleted entry
         */
        weightedPick(options, weights = []) {
            if(options.length !== weights.length) {
                throw new Error('Options and weights arrays lengths\' missmatch!')
            }
            const totalWeight = weights.reduce((acc, curr) => acc + curr, 0);
            let pick = this.float(0, totalWeight);
            for(let i = 0; i < weights.length; i++) {
                pick -= weights[i];
                if(pick < 0) {
                    return options[i];
                }
            }
        }

        /**
         * Returns a shuffled copy of an array
         * @param {Array<any>} array - array to be shuffled
         * @returns {Array<any>} shuffled array 
         */
        shuffle(array) {
            const shuffled = new Array(array.length);
            for(let i = 0; i < shuffled.length; i++) {
                shuffled[i] = array[i];
            }
            for(let i = 0; i < shuffled.length; i++) {
                const indexToSwapWith = this.int(0, shuffled.length);
                const temp = shuffled[indexToSwapWith];
                shuffled[indexToSwapWith] = shuffled[i];
                shuffled[i] = temp;
            }
            return shuffled;
        }

        rgb() {
            return Mx.Draw.Color.rgb(
                this.int(0, 255),
                this.int(0, 255),
                this.int(0, 255),
            );
        }

        rgba() {
            return Mx.Draw.Color.rgba(
                this.int(0, 255),
                this.int(0, 255),
                this.int(0, 255),
                this.fract()
            );
        }

        dice(dieSize = 6, diceNumber = 1) {
            if(diceNumber === 1) {
                return this.int(1, dieSize + 1);
            } 
            return Mx.Ds.range(0, diceNumber).map(i => this.int(1, dieSize + 1));
        }

        vertex(xMin, yMin, xMax, yMax) {
            return Mx.Geo.Vertex.create(
                this.float(xMin, xMax),
                this.float(yMin, yMax)
            );
        }

    },

    /** ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== 
     * Math util
     */
    Math: {

        clamp(value, min, max) {
            if(value < min) {
                return min;
            } else if (value > max) {
                return max;
            } else {
                return value;
            }
        },

        between(value, min, max) {
            return value >= min && value <= max;
        },

    },

    /** ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== 
     * Data Structures and Tools
     */
    Ds: {

        arr(n, mapper) {
            return Mx.Ds.range(0, n).map(mapper);
        },

        /**
         * TODO
         * @param {number} min 
         * @param {number} max 
         * @param {number} step 
         * @returns {Array<number>}
         */
        range(min, max, step = 1) {
            const arr = [];
            for(let i = min; i < max; i += step) {
                arr.push(i);
            }
            return arr;
        },

        /**
         * Ring array iterator
         */
         Ring: class {

            constructor(baseArray = [], initialIndex = 0) {
                this.values = baseArray;
                this.i = initialIndex;
            }
    
            add(item) {
                this.values.push(item);
                return this;
            }
    
            replace(item) {
                this.values[this.i] = item;
                return this;
            }
            
            reset() {
                this.i = 0;
                return this;
            }
    
            get() {
                return this.values[this.i];
            }
    
            next(step = 1) {
                this.i += step;
                this.i = this.i < this.values.length ? this.i : (this.i - this.values.length);
                return this.get();
            }
    
            prev(step = 1) {
                this.i -= step;
                this.i = this.i >= 0 ? this.i : (this.values.length + this.i);
                return this.get();
            }
        
        },

        /**
         * Back and forth array iterator
         */
        BackAndForth: class {

            constructor(baseArray = [], initialIndex = 0, initialForward = true) {
                this.values = baseArray;
                this.i = initialIndex;
                this.directionForward = initialForward;
            }

            add(item) {
                this.values.push(item);
                return this;
            }

            replace(item) {
                this.values[this.i] = item;
                return this;
            }
            
            reset() {
                this.i = 0;
                this.directionForward = true;
                return this;
            }
            
            reverse() {
                this.directionForward = !this.directionForward;
                return this;
            }

            get() {
                return this.values[this.i];
            }

            next(step = 1) {
                if(this.directionForward) {
                    this.i += step;
                    if(this.i >= this.values.length) {
                        this.i = 2 * this.values.length - this.i - 1;
                        this.directionForward = false;
                    }
                } else {
                    this.i -= step;
                    if(this.i < 0) {
                        this.i *= -1;
                        this.directionForward = true;
                    }
                }
                return this.get();
            }

            prev(step = 1) {
                return this.next(-step);
            }

        },

        /**
         * 2D simulating array wrapper
         */
        Array2D: class {

            constructor(xSize, ySize) {
                this.xSize = xSize;
                this.ySize = ySize;
                this.values = new Array(xSize * ySize);
            }

            put(x, y, v) {
                this.values[y * this.xSize + x] = v; 
                return this;
            }

            get(x, y) {
                return this.values[y * this.xSize + x]
            }

            safeGet(x, y, defaultValue = null) {
                if(this.inRange(x, y)) {
                    return this.get(x, y);
                }
                return defaultValue;
            }

            forEach(callback = (v, x, y) => {}) {
                for(let x = 0; x < this.xSize; x++) {
                    for(let y = 0; y < this.ySize; y++) {
                        callback(this.get(x, y), x, y);
                    }
                }
                return this;
            }

            map(mapper = (v, x, y) => v) {
                for(let x = 0; x < this.xSize; x++) {
                    for(let y = 0; y < this.ySize; y++) {
                        this.put(x, y, mapper(this.get(x, y), x, y));
                    }
                }
                return this;
            }

            inRange(x, y) {
                return (
                    x >= 0 && x < this.xSize &&
                    y >= 0 && y < this.ySize 
                );
            }
        }

    },

    /** ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== 
     * Iteration tools
     */
    It: {

        /**
         * TODO
         * @param {number} times 
         * @param {Function} callback 
         */
        times(times, callback) {
            for(let i = 0; i < times; i++) {
                callback(i, times);
            }
        },


        /**
         * Interval wrapper
         */
        Loop: class {

            static start(tps, callback) {
                return new Mx.It.Loop(tps, callback).start();
            }

            constructor(tps, callback) {
                this.tps = tps;
                this.tickCount = 0;
                this._interval; 
                this._callback = callback;
            }

            start() {
                this._callback(this);
                this._interval = setInterval(loop => {
                    loop.tickCount++;
                    loop._callback(loop);
                    Mx.Input._clearJustUpAndDown();
                }, 1000/this.tps, this);
                return this;
            }

            stop() {
                clearInterval(this._interval);
                this._interval = null;
                return this;
            }

        }

    },

    /** ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== 
     * Geometry entities and tools
     */
    Geo: {

        toPolar(x, y) {
            let phi; 
            if(x === 0) {
                phi = y > 0 ? Math.PI/2 : Math.PI/2 * 3;
            } else {
                phi = Math.atan(y/x);
                if (x < 0) {
                    phi += Math.PI;
                }
            }
            return {
                r: Mx.Geo.Distance.simple(0, 0, x, y),
                phi: phi
            };
        },

        toCartesian(phi, r) {
            return {
                x: r * Math.cos(phi),
                y: r * Math.sin(phi)
            };
        },

        Intersect: {

            lines(s1, s2) {
                let tNom = (s1.x1 - s2.x1) * (s2.y1 - s2.y2) - (s1.y1 - s2.y1) * (s2.x1 - s2.x2);
                let uNom = - ((s1.x1 - s1.x2) * (s1.y1 - s2.y1) - (s1.y1 - s1.y2) * (s1.x1 - s2.x1));
                let tDen = (s1.x1 - s1.x2) * (s2.y1 - s2.y2) - (s1.y1 - s1.y2) * (s2.x1 - s2.x2);
                if(tDen === 0) { // -> lines are parallel
                    return {
                        parallel: true,
                        vertex: null,
                        intersect: false,
                        t: null,
                        u: null
                    };
                } 
                let t = tNom/tDen;
                let u = uNom/tDen;
                return {
                    parallel: false,
                    vertex: new Mx.Geo.Vertex(s1.x1 + t * (s1.x2 - s1.x1), s1.y1 + t * (s1.y2 - s1.y1)),
                    intersect: t > 0 && t < 1 && u > 0 && u < 1,
                    t: t,
                    u: u
                };
            },

            rectangles(r1, r2, backgroundColor, borderColor, borderThickness) {
                const xs = Math.max(r1.x, r2.x);
                const ys = Math.max(r1.y, r2.y);
                const xe = Math.min(r1.x + r1.width, r2.x + r2.width);
                const ye = Math.min(r1.y + r1.height, r2.y + r2.height);
                if(xe > xs && ye > ys) {
                    const w = Math.abs(xs - xe);
                    const h = Math.abs(ys - ye);
                    return {
                        intersect: true,
                        rectangle: new Mx.Geo.Rectangle(xs, ys, w, h, backgroundColor,  borderColor, borderThickness)
                    };
                } else {
                    return {
                        intersect: false,
                        rectangle: null
                    };
                }


            }

        },

        Distance: {

            simple(x1, y1, x2, y2) {
                return Math.sqrt((x1 - x2)**2 + (y1 - y2)**2);
            },

            vertexVsVertex(v1, v2) {
                return this.simple(v1.x, v1.y, v2.x, v2.y);
            },

            vertexVsCircle(v, c) {
                return this.simple(v.x, v.y, c.x, c.y) - c.radius;
            },

            circleVsCircle(c1, c2) {
                return this.simple(c1.x, c1.y, c2.x, c2.y) - c1.radius - c2.radius;
            }

        },

        Collision: {

            vertexVsCircle(v, c) {
                return Mx.Geo.Distance.vertexVsCircle(v, c) < 0;
            },

            circleVsCircle(c1, c2) {
                return Mx.Geo.Distance.circleVsCircle(c1, c2) < 0;
            },

            vertexVsRectangle(v, r) {
                return (
                    v.x > r.x &&
                    v.x < r.x + r.width &&
                    v.y > r.y &&
                    v.y < r.y + r.height
                );
            },

            rectangleVsRectangle(r1, r2) {
                return (
                    r1.x + r1.width > r2.x &&
                    r1.x < r2.x + r2.width &&
                    r1.y + r1.height > r2.y &&
                    r1.y < r2.y + r2.height
                );
            },

            lineVsLine(s1, s2) {
                return Mx.Geo.Intersect.lines(s1, s2).intersect;
            },

            massCircles(entities = [], onCollide = (e1, e2) => {}) {
                for(let i = 0; i < entities.length; i++) {
                    for(let j = i + 1; j < entities.length; j++) {
                        const e1 = entities[i];
                        const e2 = entities[j];
                        if(Mx.Geo.Collision.circleVsCircle(e1.getBoundingCircle(), e2.getBoundingCircle())) {
                            onCollide(e1, e2);
                            onCollide(e2, e1);
                        }
                    }
                }
            },

            massRectangles(entities = [], onCollide = (e1, e2) => {}) {
                for(let i = 0; i < entities.length; i++) {
                    for(let j = i + 1; j < entities.length; j++) {
                        const e1 = entities[i];
                        const e2 = entities[j];
                        if(Mx.Geo.Collision.rectangleVsRectangle(e1.getBoundingRectangle(), e2.getBoundingRectangle())) {
                            onCollide(e1, e2);
                            onCollide(e2, e1);
                        }
                    }
                }
            }

        },

        Vertex: class extends _Entity {

            toCircle(radius, backgroundColor, borderColor, borderThickness) {
                return new Mx.Geo.Circle(this.x, this.y, radius, backgroundColor, borderColor, borderThickness);
            }

            clone() {
                return Mx.Geo.Vertex.create(this.x, this.y);
            }

        },

        Line: class extends _Entity {

            constructor(x1, y1, x2, y2, color, thickness) {
                super(-1, -1);
                this.x1 = x1;
                this.y1 = y1;
                this.x2 = x2;
                this.y2 = y2;
                this.color = color;
                this.thickness = thickness;
            }

            place(x, y) {
                const dx = x - this.x1;
                const dy = y - this.y1;
                this.x1 = x;
                this.y1 = y;
                this.x2 += dx;
                this.y2 += dy;
                return this;       
            }
        
            move(x, y) {
                this.x1 += x;
                this.y1 += y;
                this.x2 += x;
                this.y2 += y;
                return this;
            }

            easeTo(x, y, ratio = 0.1) {
                const c = this.getCenter();
                const dx = x - c.x;
                const dy = y - c.y;
                this.move(dx * ratio, dy * ratio);
                return this;
            }
        
            
            scale(scaleX = 1, scaleY = scaleX, xOrigin, yOrigin) {
                if(xOrigin === undefined || yOrigin === undefined) {
                    const {x, y} = this.getCenter();
                    xOrigin = x;
                    yOrigin = y;
                }
                this.x1 = scaleX * (this.x1 - xOrigin) + xOrigin;
                this.y1 = scaleY * (this.y1 - yOrigin) + yOrigin;
                this.x2 = scaleX * (this.x2 - xOrigin) + xOrigin;
                this.y2 = scaleY * (this.y2 - yOrigin) + yOrigin;
                return this;
            }
        
            rotate(phi, xOrigin, yOrigin) {
                if(xOrigin === undefined || yOrigin === undefined) {
                    const {x, y} = this.getCenter();
                    xOrigin = x;
                    yOrigin = y;
                }
                const r1 = Mx.Geo.Distance.simple(xOrigin, yOrigin, this.x1, this.y1);
                const pCrd1 = Mx.Geo.toPolar(this.x1 - xOrigin, this.y1 - yOrigin);
                const cCrd1 = Mx.Geo.toCartesian(phi + pCrd1.phi, r1);
                this.x1 = cCrd1.x + xOrigin;
                this.y1 = cCrd1.y + yOrigin;
                const r2 = Mx.Geo.Distance.simple(xOrigin, yOrigin, this.x2, this.y2);
                const pCrd2 = Mx.Geo.toPolar(this.x2 - xOrigin, this.y2 - yOrigin);
                const cCrd2 = Mx.Geo.toCartesian(phi + pCrd2.phi, r2);
                this.x2 = cCrd2.x + xOrigin;
                this.y2 = cCrd2.y + yOrigin;
                return this;
            }
        
            _getDrawn(canvasHandler) {
                canvasHandler.drawLine(this.x1, this.y1, this.x2, this.y2, this.color, this.thickness);
            }

            getCenter() {
                return Mx.Geo.Vertex.create(
                    (this.x1 + this.x2)/2,
                    (this.y1 + this.y2)/2
                );
            }

            clone() {
                return Mx.Geo.Line.create(
                    this.x1, this.y1, this.x2, this.y2, 
                    this.color, this.thickness
                );
            }

            length() {
                return Mx.Geo.Distance.simple(this.x1, this.y1, this.x2, this.y2);
            }

            getBoundingRectangle(padding = this.hitboxPadding, backgroundColor = undefined, borderColor = 'red', borderThickness = 1) {
                return Mx.Geo.Rectangle.create(
                    Math.min(this.x1, this.x2) - padding,
                    Math.min(this.y1, this.y2) - padding,
                    Math.abs(this.x1 - this.x2) + 2 * padding,
                    Math.abs(this.y1 - this.y2) + 2 * padding,
                    backgroundColor, borderColor, borderThickness
                );
            }
        
            getBoundingCircle(padding = this.hitboxPadding, backgroundColor = undefined, borderColor = 'red', borderThickness = 1) {
                return Mx.Geo.Circle.create(
                    (this.x1 + this.x2)/2,
                    (this.y1 + this.y2)/2,
                    this.length()/2,
                    backgroundColor, borderColor, borderThickness
                );
            }

        },

        Polyline: class extends _Entity {

            static fromVerices(vertices, color, thickness) {
                const vi = vertices.map(v => [v.x, v.y]);
                return Mx.Geo.Polyline.create(vi, color, thickness);
            }

            constructor(verticesInfo, color, thickness) {
                super(...verticesInfo[0]);
                this.verticesInfo = verticesInfo;
                this.color = color;
                this.thickness = thickness;
            }

            place(x, y) {
                const {x: ix, y: iy} = this.getCenter();
                const dx = x - ix;
                const dy = y - iy;
                this.verticesInfo[0] = [x, y];
                for(let i = 1; i < this.verticesInfo.length; i++) {
                    const [cx, cy] = this.verticesInfo[i];
                    this.verticesInfo[i] = [cx + dx, cy + dy]; 
                }
                return this;
            }

            move(x, y) {
                for(let v of this.verticesInfo) {
                    v[0] += x;
                    v[1] += y;
                }
                return this;
            }

            easeTo(x, y, ratio = 0.1) {
                const {x: cx, y: cy} = this.getCenter();
                const dx = x - cx;
                const dy = y - cy;
                this.move(dx * ratio, dy * ratio);
                return this;
            }

            rotate(phi, xOrigin, yOrigin) {
                if(xOrigin === undefined && yOrigin === undefined) {
                    const c = this.getCenter();
                    xOrigin = c.x;
                    yOrigin = c.y;
                }
                for(let v of this.verticesInfo) {
                    const r = Mx.Geo.Distance.simple(...v, xOrigin, yOrigin);
                    const pCrd = Mx.Geo.toPolar(v[0] - xOrigin, v[1] - yOrigin);
                    const cCrd = Mx.Geo.toCartesian(phi + pCrd.phi, r);
                    v[0] = cCrd.x + xOrigin;
                    v[1] = cCrd.y + yOrigin;
                }
                return this;
            }

            _getDrawn(canvasHandler) {
                canvasHandler.drawPolyline(this.verticesInfo, this.color, this.thickness);
            }

            getCenter() {
                let x = 0;
                let y = 0;
                for(let v of this.verticesInfo) {
                    x += v[0];
                    y += v[1];
                }
                x /= this.verticesInfo.length;
                y /= this.verticesInfo.length;
                return Mx.Geo.Vertex.create(x, y);
            }

            add(x, y) {
                this.verticesInfo.push([x, y]);
                return this;
            }

            pop() {
                const [x, y] = this.verticesInfo.pop();
                return new Mx.Geo.Vertex(x, y);
            }

            toLines(color = this.color, thickness = this.thickness) {
                const lines = [];
                for(let i = 0; i < this.verticesInfo.length - 1; i++) {
                    const [x1, y1] = this.verticesInfo[i];
                    const [x2, y2] = this.verticesInfo[i + 1];
                    const line = new Mx.Geo.Line(x1, y1, x2, y2, color, thickness);
                    lines.push(line);
                }
                return lines;
            }

            toVertices() {
                return this.verticesInfo.map(v => {
                    const [x, y] = v;
                    return new Mx.Geo.Vertex(x, y);
                });
            }

            clone() {
                return Mx.Geo.Polyline.create(
                    [...this.verticesInfo.map(v => [...v])],
                    this.color, this.thickness
                );
            }

            getBoundingRectangle(padding = this.hitboxPadding, backgroundColor = undefined, borderColor = 'red', borderThickness = 1) {
                let minX = this.verticesInfo[0][0];
                let minY = this.verticesInfo[0][1];
                let maxX = this.verticesInfo[0][0];
                let maxY = this.verticesInfo[0][1];
                for(let [x, y] of this.verticesInfo.slice(1)) {
                    if(x > maxX) maxX = x;
                    if(y > maxY) maxY = y;
                    if(x < minX) minX = x;
                    if(y < minY) minY = y;
                }
                return Mx.Geo.Rectangle.create(
                    minX - padding, minY - padding,
                    maxX - minX + 2 * padding, maxY - minY + 2 * padding, 
                    backgroundColor, borderColor, borderThickness
                );
            }
        
            getBoundingCircle(padding = this.hitboxPadding, backgroundColor = undefined, borderColor = 'red', borderThickness = 1) {
                // FIXME this requires more work
                return this.getBoundingRectangle().getBoundingCircle(padding, backgroundColor, borderColor, borderThickness);
            }
        },

        Polygon: class extends _Entity {

            static fromVertices(vertices, backgroundColor, borderColor, borderThickness) {
                const vi = vertices.map(v => [v.x, v.y]);
                return Mx.Geo.Polygon(vi, backgroundColor, borderColor, borderThickness);
            }

            constructor(verticesInfo, backgroundColor, borderColor, borderThickness) {
                super(...verticesInfo[0]);
                this.body = Mx.Geo.Polyline.create(verticesInfo);
                this.backgroundColor = backgroundColor;
                this.borderColor = borderColor;
                this.borderThickness = borderThickness;
            }

            place(x, y) {
                this.body.place(x, y);
                return this;
            }

            move(x, y) {
                this.body.move(x, y);
                return this;
            }

            easeTo(x, y, ratio = 0.1) {
                this.body.easeTo(x, y, ratio);
                return this;
            }

            rotate(phi, xOrigin, yOrigin) {
                this.body.rotate(phi, xOrigin, yOrigin);
                return this;
            }

            _getDrawn(canvasHandler) {
                canvasHandler.drawPolygon(this.body.verticesInfo, this.backgroundColor, this.borderColor, this.thickness);
            }

            getCenter() {
                return this.body.getCenter();
            }

            toPolyline(color = this.borderColor, thickness = this.borderThickness) {
                const verticesInfo = [
                    ...this.body.verticesInfo.map(vi => [...vi]), 
                    [...this.body.verticesInfo[0]]
                ];
                return Mx.Geo.Polyline.create(verticesInfo, color, thickness);
            }

            add(x, y) {
                this.body.add(x, y);
                return this;
            }

            pop() {
                return this.body.pop();
            }

            toLines(color = this.color, thickness = this.thickness) {
                return this.body.toLines(color, thickness);
            }

            toVertices() {
                return this.body.toVertices();
            }

            clone() {
                return Mx.Geo.Polygon.create(
                    [...this.body.verticesInfo.map(v => [...v])],
                    this.backgroundColor, this.borderColor, this.borderThickness
                );
            }

            getBoundingRectangle(padding = this.hitboxPadding, backgroundColor = undefined, borderColor = 'red', borderThickness = 1) {
                return this.body.getBoundingRectangle(padding, backgroundColor, borderColor, borderThickness);
            }
        
            getBoundingCircle(padding = this.hitboxPadding, backgroundColor = undefined, borderColor = 'red', borderThickness = 1) {
                return this.body.getBoundingCircle(padding, backgroundColor, borderColor, borderThickness);
            }

            isPointOver(x, y) {
                return this.getBoundingRectangle().isPointOver(x, y);
            }
            
            // still needs some work @see triangulation.html
            // add more triangulation algorithms
            triangulate(backgroundColor = undefined, borderColor = 'red', borderThickness = 1) {
                let vertices = this.toVertices();
                const triangles = [];
                const targetTrianglesNumber = vertices.length - 2;
                let forward = true;
                let indexForwards = 0;
                let indexBackwards = vertices.length - 1;
                while(triangles.length < targetTrianglesNumber) {
                    let v1 = vertices[indexForwards];
                    let v2 = vertices[indexBackwards];
                    let v3;
                    if(forward) {
                        indexForwards++;
                        v3 = vertices[indexForwards];
                    } else {
                        indexBackwards--;
                        v3 = vertices[indexBackwards];
                    }
                    forward = !forward;
                    triangles.push(new Mx.Geo.Triangle(
                        v1.x, v1.y, v2.x, v2.y, v3.x, v3.y,
                        backgroundColor, borderColor, borderThickness
                    ));
                }
                return triangles;
            }

        },

        Rectangle: class extends _Entity {

            constructor(x, y, width, height, backgroundColor, borderColor, borderThickness) {
                super(x, y);
                this.width = width;
                this.height = height;
                this.backgroundColor = backgroundColor;
                this.borderColor = borderColor;
                this.borderThickness = borderThickness;
            }

            scale(scaleX = 1, scaleY = scaleX, xOrigin = this.x, yOrigin = this.y) {
                super.scale(scaleX, scaleY, xOrigin, yOrigin);
                this.width *= scaleX;
                this.height *= scaleY;
                return this;
            }

            _getDrawn(canvasHandler) {
                canvasHandler.drawRect(this.x, this.y, this.width, this.height, this.backgroundColor, this.borderColor, this.borderThickness);
            }

            isPointOver(x, y) {
                return (
                    Mx.Math.between(x, this.x, this.x + this.width) &&
                    Mx.Math.between(y, this.y, this.y + this.height)
                );
            }

            getCenter() {
                return Mx.Geo.Vertex.create(
                    this.x + this.width/2,
                    this.y + this.height/2
                );
            }

            clone() {
                return Mx.Geo.Rectangle.create(
                    this.x, this.y, this.width, this.height, 
                    this.backgroundColor, this.borderColor, this.borderThickness
                );
            }

            toPolygon() {
                return Mx.Geo.Polygon.create(
                    [
                        [this.x, this.y], 
                        [this.x + this.width, this.y],
                        [this.x + this.width, this.y + this.height], 
                        [this.x, this.y + this.height]
                    ],
                    this.backgroundColor, this.borderColor, this.borderThickness
                );
            }

            getBoundingRectangle(padding = this.hitboxPadding, backgroundColor = undefined, borderColor = 'red', borderThickness = 1) {
                return Mx.Geo.Rectangle.create(
                    this.x - padding, this.y - padding, 
                    this.width + 2 * padding, this.height + 2 * padding, 
                    backgroundColor, borderColor, borderThickness
                );
            }
        
            getBoundingCircle(padding = this.hitboxPadding, backgroundColor = undefined, borderColor = 'red', borderThickness = 1) {
                const {x, y} = this.getCenter();
                const r = Math.sqrt((x - this.x) ** 2 + (y - this.y) ** 2);
                return Mx.Geo.Circle.create(
                    x, y, r + padding, 
                    backgroundColor, borderColor, borderThickness
                );
            }

        },

        Triangle: class extends _Entity {

            constructor(x1, y1, x2, y2, x3, y3, backgroundColor, borderColor, borderThickness) {
                super(-1. -1);
                this.x1 = x1;
                this.y1 = y1;
                this.x2 = x2;
                this.y2 = y2;
                this.x3 = x3;
                this.y3 = y3;
                this.backgroundColor = backgroundColor;
                this.borderColor = borderColor;
                this.borderThickness = borderThickness;
            }

            place(x, y) {
                const {x: cx, y: cy} = this.getCenter();
                const dx = x - cx;
                const dy = y - cy;
                this.x1 += dx;
                this.y1 += dy;
                this.x2 += dx;
                this.y2 += dy;
                this.x3 += dx;
                this.y3 += dy;
                return this;       
            }
        
            move(x, y) {
                this.x1 += x;
                this.y1 += y;
                this.x2 += x;
                this.y2 += y;
                this.x3 += x;
                this.y3 += y;
                return this;
            }

            easeTo(x, y, ratio = 0.1) {
                const c = this.getCenter();
                const dx = x - c.x;
                const dy = y - c.y;
                this.move(dx * ratio, dy * ratio);
                return this;
            }
        
            scale(scaleX = 1, scaleY = scaleX, xOrigin = this.x1, yOrigin = this.y1) {
                this.x1 = scaleX * (this.x1 - xOrigin) + xOrigin;
                this.y1 = scaleY * (this.y1 - yOrigin) + yOrigin;
                this.x2 = scaleX * (this.x2 - xOrigin) + xOrigin;
                this.y2 = scaleY * (this.y2 - yOrigin) + yOrigin;
                this.x3 = scaleX * (this.x3 - xOrigin) + xOrigin;
                this.y3 = scaleY * (this.y3 - yOrigin) + yOrigin;
                return this;
            }
        
            rotate(phi, xOrigin, yOrigin) {
                if(xOrigin === undefined || yOrigin === undefined) {
                    const {x, y} = this.getCenter();
                    xOrigin = x;
                    yOrigin = y;
                }
                const r1 = Mx.Geo.Distance.simple(xOrigin, yOrigin, this.x1, this.y1);
                const pCrd1 = Mx.Geo.toPolar(this.x1 - xOrigin, this.y1 - yOrigin);
                const cCrd1 = Mx.Geo.toCartesian(phi + pCrd1.phi, r1);
                this.x1 = cCrd1.x + xOrigin;
                this.y1 = cCrd1.y + yOrigin;
                const r2 = Mx.Geo.Distance.simple(xOrigin, yOrigin, this.x2, this.y2);
                const pCrd2 = Mx.Geo.toPolar(this.x2 - xOrigin, this.y2 - yOrigin);
                const cCrd2 = Mx.Geo.toCartesian(phi + pCrd2.phi, r2);
                this.x2 = cCrd2.x + xOrigin;
                this.y2 = cCrd2.y + yOrigin;
                const r3 = Mx.Geo.Distance.simple(xOrigin, yOrigin, this.x3, this.y3);
                const pCrd3 = Mx.Geo.toPolar(this.x3 - xOrigin, this.y3 - yOrigin);
                const cCrd3 = Mx.Geo.toCartesian(phi + pCrd3.phi, r3);
                this.x3 = cCrd3.x + xOrigin;
                this.y3 = cCrd3.y + yOrigin;
                return this;
            }
        
            _getDrawn(canvasHandler) {
                canvasHandler.drawPolygon(
                    [[this.x1, this.y1], [this.x2, this.y2], [this.x3, this.y3]],
                    this.backgroundColor, this.borderColor, this.borderThickness
                );
            }

            getCenter() {
                return Mx.Geo.Vertex.create(
                    (this.x1 + this.x2 + this.x3)/3,
                    (this.y1 + this.y2 + this.y3)/3
                );
            }

            clone() {
                return Mx.Geo.Triangle.create(
                    this.x1, this.y1, this.x2, this.y2, this.x3, this.y3,
                    this.backgroundColor, this.borderColor, this.borderThickness
                );
            }

            toLines(borderColor = this.borderColor, borderThickness = this.borderThickness) {
                return [
                    new Mx.Geo.Line(this.x1, this.y1, this.x2, this.y2, borderColor, borderThickness),
                    new Mx.Geo.Line(this.x2, this.y2, this.x3, this.y3, borderColor, borderThickness),
                    new Mx.Geo.Line(this.x3, this.y3, this.x1, this.y1, borderColor, borderThickness)
                ];
            }

            toVertices() {
                return [
                    new Mx.Geo.Vertex(this.x1, this.y1),
                    new Mx.Geo.Vertex(this.x2, this.y2),
                    new Mx.Geo.Vertex(this.x3, this.y3)
                ];
            }

            toPolygon(backgroundColor = this.backgroundColor, borderColor = this.borderColor, borderThickness = this.borderThickness) {
                return new Mx.Geo.Polygon(
                    [[this.x1, this.y1], [this.x2, this.y2], [this.x3, this.y3]],
                    backgroundColor, borderColor, borderThickness
                );
            }

            // @see https://stackoverflow.com/questions/2049582/how-to-determine-if-a-point-is-in-a-2d-triangle
            isPointOver(x, y) {
                const d1 = (x - this.x2) * (this.y1 - this.y2) - (this.x1 - this.x2) * (y - this.y2);
                const d2 = (x - this.x3) * (this.y2 - this.y3) - (this.x2 - this.x3) * (y - this.y3);
                const d3 = (x - this.x1) * (this.y3 - this.y1) - (this.x3 - this.x1) * (y - this.y1);
                const neg = (d1 < 0) || (d2 < 0) || (d3 < 0);
                const pos = (d1 > 0) || (d2 > 0) || (d3 > 0);
                return !(neg && pos);
            }
 
            getBoundingRectangle(padding = this.hitboxPadding, backgroundColor = undefined, borderColor = 'red', borderThickness = 1) {
                // todo
            }
        
            getBoundingCircle(padding = this.hitboxPadding, backgroundColor = undefined, borderColor = 'red', borderThickness = 1) {
                // todo
            }

        },

        Circle: class extends _Entity {

            constructor(x, y, radius, backgroundColor, borderColor, borderThickness) {
                super(x, y);
                this.radius = radius;
                this.backgroundColor = backgroundColor;
                this.borderColor = borderColor;
                this.borderThickness = borderThickness;
            }

            scale(scaleX, scaleY, xOrigin = this.x, yOrigin = this.y) {
                super.scale(scaleX, scaleY, xOrigin, yOrigin);
                this.radius *= scaleX;
                return this;
            }

            _getDrawn(canvasHandler) {
                canvasHandler.drawCircle(this.x, this.y, this.radius, this.backgroundColor, this.borderColor, this.borderThickness);
            }

            isPointOver(x, y) {
                return Mx.Geo.Distance.simple(this.x, this.y, x, y) < this.radius;
            }

            getCenter() {
                return Mx.Geo.Vertex.create(this.x, this.y);
            }

            clone() {
                return Mx.Geo.Circle.create(
                    this.x, this.y, this.radius, 
                    this.backgroundColor, this.borderColor, this.borderThickness
                );
            }

            toInscribedPolygon(backgroundColor = this.backgroundColor, borderColor = this.borderColor, borderThickness = this.borderThickness) {
                // todo
            }

            toCircumscribedPolygon(backgroundColor = this.backgroundColor, borderColor = this.borderColor, borderThickness = this.borderThickness) {
                // todo
            }

            getBoundingRectangle(padding = this.hitboxPadding, backgroundColor = undefined, borderColor = 'red', borderThickness = 1) {
                return Mx.Geo.Rectangle.create(
                    this.x - this.radius - padding, this.y - this.radius - padding,
                    2 * (this.radius + padding), 2 * (this.radius + padding),
                    backgroundColor, borderColor, borderThickness
                );
            }
        
            getBoundingCircle(padding = this.hitboxPadding, backgroundColor = undefined, borderColor = 'red', borderThickness = 1) {
                return Mx.Geo.Circle.create(
                    this.x, this.y, this.radius + padding, 
                    backgroundColor, borderColor, borderThickness
                );
            }

        },

    },

    /** ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== 
     * Drawing and canvas handling classes and tools
     */
    Draw: {

        Color: {

            rgb(r, g, b) {
                return `rgb(${r}, ${g}, ${b})`;
            },

            rgba(r, g, b, a = 1) {
                return `rgba(${r}, ${g}, ${b}, ${a})`;
            },

            hsl(h, s, l = 50) {
                return `hsl(${h}, ${s}%, ${l}%)`;
            },

            hsla(h, s, l = 50, a = 1) {
                return `hsla(${h}, ${s}%, ${l}%, ${a})`;
            }

        },

        CanvasHandler: class {

            static init(parentId) {
                return new Mx.Draw.CanvasHandler(parentId)
            }

            static create() {
                const home = document.createElement('div');
                home.id = 'canvas-home';
                home.style.width = '100vw';
                home.style.height = '100vh';
                document.body.innerHTML = '';
                document.body.appendChild(home);
                document.body.style.margin = 0;
                return Mx.Draw.CanvasHandler.init('canvas-home');
            }

            constructor(parentId) {
                this.canvas = null;
                this.context = null;
                this.parentId = parentId;
                this.parent = null;
                this._storedVpX = 0;
                this._storedVpY = 0;
                this._storedVpScale = 1;
                this._storedAlpha = 1;
                this.vpX = 0;
                this.vpY = 0;
                this.vpScale = 1;
                this.alpha = 1;
                this.isMouseOver = false;
                this.isMouseDown = false;
                this.isMouseDrag = false;
                this._listenerAttached = false;
                this.onMouseOver = () => {};
                this.onMouseOut = () => {};
                this.onMouseDown = () => {};
                this.onMouseUp = () => {};
                this.onMouseDrag = () => {};
                this.onResize = () => {};
                this.init();
                this.refit();
                this.pix = new _PixImageDataManager(this.context, this.canvas, true);
                this.post = new _CanvasHandlerPostProcessor(this);
            }

            setShadow(color = '#000000', blur = 0, offsetX = 0, offsetY = 0) {
                this.context.shadowColor = color;
                this.context.shadowBlur = blur;
                this.context.shadowOffsetX = offsetX;
                this.context.shadowOffsetY = offsetY;
                return this;
            }
        
            resetShadow() {
                this.context.shadowColor = '#000000';
                this.context.shadowBlur = 0;
                this.context.shadowOffsetX = 0;
                this.context.shadowOffsetY = 0;
                return this;
            }

            disableShadow() {
                this.setShadow = () => this;
                this.resetShadow = () => this;
            } 

            handles(entities) {
                for(let i = 0; i < entities.length; i++) {
                    const e = entities[i];
                    e.animate();
                    e.update();
                    e.travel();
                    this.draw(e);
                }
                for(let i = entities.length - 1; i >= 0; i--) {
                    const e = entities[i];
                    e.listen();
                }   
                return this;
            }

            center(x, y) {
                const dx = this.canvas.width/2 - x;
                const dy = this.canvas.height/2 - y;
                this.setTransform(dx, dy);
                return this;
            }

            centerOn(entity) {
                return this.center(entity.x, entity.y);
            }

            storeTransform() {
                this._storedVpX = this.vpX;
                this._storedVpY = this.vpY;
                this._storedVpScale = this.vpScale;
                this._storedAlpha = this.alpha;
                Mx.Input.update();
                return this;
            }

            resetTransform() {
                this.context.resetTransform();
                this.vpX = 0;
                this.vpY = 0;
                this.vpScale = 1;
                this.alpha = 1;
                Mx.Input.update();
                return this;
            }

            restoreTransform() {
                this.context.resetTransform();
                this.moveViewport(this._storedVpX, this._storedVpY);
                this.scaleViewport(this._storedVpScale);
                this.setAlpha(this._storedAlpha);
                Mx.Input.update();
                return this;
            }

            restoreAlpha() {
                this.setAlpha(this._storedAlpha);
                return this;
            }
            
            setTransform(x = this.vpX, y = this.vpY, scale = this.vpScale, alpha = this.alpha) {
                this.resetTransform();
                this.moveViewport(x, y);
                this.scaleViewport(scale);
                this.setAlpha(alpha);
                Mx.Input.update();
                return this;
            }

            scaleToSize(targetWidth = 800, targetHeight = 600) {
                const {width, height} = this.canvas;
                const scale = Math.min(width/targetWidth, height/targetHeight);
                this.setViewportScale(scale);
                return this;
            }
    
            
            on(event, callback = () => {}) {
                this._listenerAttached = true;
                switch(event) {
                    case 'over': this.onMouseOver = callback; break;
                    case 'out': this.onMouseOut = callback; break;
                    case 'down': this.onMouseDown = callback; break;
                    case 'up': this.onMouseUp = callback; break;
                    case 'drag': this.onMouseDrag = callback; break;
                    case 'resize': this.onResize = callback; break;
                    default: break;
                }
                return this;
            }

            clearListeners() {
                this.onMouseOver = () => {};
                this.onMouseOut = () => {};
                this.onMouseDown = () => {};
                this.onMouseUp = () => {};
                this.onMouseDrag = () => {};
                this.onResize = () => {};
                return this;
            }

            enableDrag() {
                return this.on('down', (mouse, handler) => {
                    handler._xDragHook = mouse.xInCanvas;
                    handler._yDragHook = mouse.yInCanvas;
                }).on('drag', (mouse, handler) => {
                    // FIXME but works for now
                    if(Math.abs(mouse.moveX) > 1 || Math.abs(mouse.moveY) > 1) {
                        handler.moveViewport(mouse.moveX * 2, mouse.moveY * 2);
                    }
                });
            }

            enableZoom(scaleFactor = 1.1) {
                document.onwheel = event => {
                    if(event.deltaY > 0) {
                        this.scaleViewport(scaleFactor);
                    } else {
                        this.scaleViewport(1/scaleFactor);
                    }
                };
                return this;
            }

            isPointOver(x, y) {
                return true; // TODO but works for now
            }
        
            listen() {
                if(!this._listenerAttached) {
                    return this;
                }
                // setup
                const mouse = Mx.Input.mouse();
                const isNowMouseOver = this.isPointOver(mouse.xInCanvas, mouse.yInCanvas);
                const isNowMouseDown = mouse.left;
                // mouse over
                if(isNowMouseOver) {
                    if(!this.isMouseOver) {
                        this.onMouseOver(mouse, this);
                    }
                    this.isMouseOver = true;
                } else {
                    if(this.isMouseOver) {
                        this.onMouseOut(mouse, this);
                        this.isMouseOver = false;
                    }
                } 
                // mouse down 
                if(isNowMouseDown) {
                    if(!this.isMouseDown) {
                        if(isNowMouseOver) {
                            this.onMouseDown(mouse, this);
                            this.isMouseDown = true;
                        }
                    } else {
                        if(mouse.draggedEntity === null) {
                            mouse.draggedEntity = this;
                        }
                        if(mouse.draggedEntity === this) {
                            this.onMouseDrag(mouse, this);
                        }
                    }
                } else {
                    if(this.isMouseDown) {
                        this.onMouseUp(mouse, this);
                        this.isMouseDown = false;
                        mouse.draggedEntity = null;
                    }
                }
                // fin
                return this;
            }

            moveViewport(x, y) {
                this.vpX += x;
                this.vpY += y;
                this.context.translate(x, y);
                Mx.Input.update();
                return this;
            }

            scaleViewport(scale) {
                this.vpScale *= scale;
                this.context.scale(scale, scale);
                Mx.Input.update();
                return this;
            }

            setViewportScale(scale) {
                const rescale = scale/this.vpScale;
                return this.scaleViewport(rescale);
            }

            setAlpha(alpha) {
                this.alpha = alpha;
                this.context.globalAlpha = alpha;
                return this;
            }

            _fillStyle(color = 'black') {
                this.context.fillStyle = color;
                return this;
            }

            _strokeStyle(color = 'black', lineWidth = 1) {
                this.context.strokeStyle = color;
                this.context.lineWidth = lineWidth;
                return this;
            }

            init() {
                this.canvas = document.createElement('canvas');
                this.canvas.classList.add(`${this.parentId}-canvas`);
                this.context = this.canvas.getContext('2d', {alpha: false});
                this.parent = document.getElementById(this.parentId);
                this.parent.appendChild(this.canvas);
                window.addEventListener('resize', event => this.refit(), this);
                return this;
            }

            refit() {
                this.canvas.width = this.parent.clientWidth;
                this.canvas.height = this.parent.clientHeight;
                this.onResize(this);
                return this;
            }

            clear() {
                return this.fill('#000000');
            }
    
            fill(color = 'black') {
                this._fillStyle(color);
                this.context.resetTransform();
                this.context.fillRect(
                    0, 0,
                    this.canvas.width, 
                    this.canvas.height
                );
                this.context.translate(this.vpX, this.vpY);
                this.context.scale(this.vpScale, this.vpScale);
                return this;
            }

            getBoundingRectangle(backgroundColor = undefined, borderColor = 'black', borderThickness = 1) {
                return Mx.Geo.Rectangle.create(
                    -this.vpX / this.vpScale,
                    -this.vpY / this.vpScale,
                    this.canvas.width / this.vpScale,
                    this.canvas.height / this.vpScale,
                    backgroundColor, borderColor, borderThickness
                );
            }

            grid(xSpacing = 16, ySpacing = xSpacing, color = 'gray', thickness = 0.5) {
                const bx = -this.vpX / this.vpScale;
                const by = -this.vpY / this.vpScale;
                const bw = this.canvas.width / this.vpScale;
                const bh = this.canvas.height / this.vpScale;
                const offx = -this.vpX % xSpacing;
                const offy = -this.vpY % ySpacing;
                const xStart = bx - offx - xSpacing
                const xEnd = xStart + bw + 2 * xSpacing;
                const yStart = by - offy - ySpacing;
                const yEnd = yStart + bh + 2 * ySpacing;
                for(let x = xStart; x < xEnd; x += xSpacing) {
                    this.drawLine(x, yStart, x, yEnd, color, thickness);
                }
                for(let y = yStart; y < yEnd; y += ySpacing) {
                    this.drawLine(xStart, y, xEnd, y, color, thickness);
                }
                return this;
            }

            // Mx.Entity
            draw(entity) {
                if(!entity.hidden && entity._canBeDrawn(this)) {
                    this.setShadow(entity.shadowColor, entity.shadowBlur, entity.shadowOffsetX, entity.shadowOffsetY);
                    entity._getDrawn(this);
                    this.resetShadow();
                }
                return this
            }

            draws(...entities) {
                for(let e of entities) {
                    this.draw(e);
                }
                return this;
            }

            // Rectangle
            fillRect(x, y, width, height, color = 'black') {
                this._fillStyle(color);
                this.context.fillRect(x, y, width, height);
                return this;
            } 
    
            strokeRect(x, y, width, height, color = 'black', thickness = 1) {
                this._strokeStyle(color, thickness);
                this.context.strokeRect(x, y, width, height);
                return this;
            }
    
            drawRect(x, y, width, height, fillColor, strokeColor, thickness) {
                if(fillColor) {
                    this._fillStyle(fillColor);
                    this.context.fillRect(x, y, width, height);
                }
                if(strokeColor) {
                    this._strokeStyle(strokeColor, thickness);
                    this.context.strokeRect(x, y, width, height);
                }
                return this;
            }

            // Circle
            fillCircle(x, y, radius, color = 'black') {
                this._fillStyle(color);
                this.context.beginPath();
                this.context.arc(x, y, radius, 0, Math.PI * 2);
                this.context.fill();
                return this;
            }

            strokeCircle(x, y, radius, color = 'black', thickness = 1) {
                this._strokeStyle(color, thickness);
                this.context.beginPath();
                this.context.arc(x, y, radius, 0, Math.PI * 2);
                this.context.stroke();
                return this;
            }

            drawCircle(x, y, radius, fillColor, strokeColor, thickness) {
                this.context.beginPath();
                this.context.arc(x, y, radius, 0, Math.PI * 2);
                if(fillColor) {
                    this._fillStyle(fillColor);
                    this.context.fill();
                }
                if(strokeColor) {
                    this._strokeStyle(strokeColor, thickness);
                    this.context.stroke();
                }
                return this;
            }

            // Line
            drawLine(x1, y1, x2, y2, color = 'black', thickness = 1) {
                this._strokeStyle(color, thickness);
                this.context.beginPath();
                this.context.moveTo(x1, y1);
                this.context.lineTo(x2, y2);
                this.context.stroke();
                return this;
            }

            drawPolyline(vertices, color = 'black', thickness = 1) {
                this._strokeStyle(color, thickness);
                this.context.beginPath();
                const startVertex = vertices[0];
                this.context.moveTo(...startVertex);
                for(let vertex of vertices.slice(1)) {
                    this.context.lineTo(...vertex);
                }
                this.context.stroke();
                return this;
            }

            // Polygon
            drawPolygon(vertices, fillColor, strokeColor, thickness = 1) {
                this._fillStyle(fillColor);
                this._strokeStyle(strokeColor, thickness);
                this.context.beginPath();
                const startVertex = vertices[0];
                this.context.moveTo(...startVertex);
                for(let vertex of vertices.slice(1)) {
                    this.context.lineTo(...vertex);
                }
                this.context.closePath();
                if(fillColor) {
                    this.context.fill();
                }
                if(strokeColor) {
                    this.context.stroke();
                }
                return this;
            }

            // Text
            write(x, y, content, color = 'black', size = 12, font = 'Arial monospaced', rotation = 0, alpha = 1, align = 'start') {
                const blendAlpha = this.context.globalAlpha;
                this.context.save();
                this.context.textAlign = align;
                this.context.globalAlpha = blendAlpha * alpha;
                this.context.translate(x, y); 
                this.context.rotate(rotation);
                this._fillStyle(color);
                this.context.font = `${parseInt(size)}px ${font}`;
                this.context.fillText(content, 0, 0);
                this.context.restore();
                return this;
            }

            // Images
            drawSprite(
                x, y, image, spriteX, spriteY, spriteWidth, spriteHeight, 
                drawnWidth = spriteWidth, drawnHeight = spriteHeight, rotation = 0, alpha = 1, mirrored = false
            ) {
                const blendAlpha = this.context.globalAlpha;
                this.context.save();
                this.context.globalAlpha = blendAlpha * alpha;
                this.context.translate(x, y);
                this.context.rotate(rotation);
                if(mirrored) {
                    this.context.save();
                    this.context.scale(-1, 1);
                }
                this.context.drawImage(
                    image, spriteX, spriteY, spriteWidth, spriteHeight,
                    -drawnWidth/2, -drawnHeight/2, drawnWidth, drawnHeight
                );
                if(mirrored) {
                    this.context.restore();
                }
                this.context.restore();
                return this;
            }

            handleLayers(...layers) {
                for(let i = 0; i < layers.length; i++) {
                    layers[i].handleDraw(this);
                } 
                for(let i = layers.length - 1; i >= 0; i--) {
                    layers[i].handleListen(this);
                }
            }
            
            setImageSmoothing(value = true) {
                this.context.msImageSmoothingEnabled = value;
                this.context.mozImageSmoothingEnabled = value;
                this.context.webkitImageSmoothingEnabled = value;
                this.context.imageSmoothingEnabled = value;
                return true;
            }

            displayDebugInfo(loop, color = 'rgba(255, 255, 255, 0.5)') {
                const tickTime = new Date().getTime() - loop._lastTickTime                
                const fps = `FPS: ${(1000/tickTime).toFixed(2)}`;
                loop._lastTickTime = new Date().getTime();
                const vppos = `VPPOS: (x: ${this.vpX.toFixed(2)}, y: ${this.vpY.toFixed(2)})`;
                const vpsc = `VPSC: ${(100 * this.vpScale).toFixed(2)}%`;
                const cdim = `CDIM: (x: ${this.canvas.width.toFixed(2)}, y: ${this.canvas.height.toFixed(2)})`;
                const mpos = `MPOS: (x: ${Mx.Input._mouse.xInCanvas.toFixed(2)}, y: ${Mx.Input._mouse.yInCanvas.toFixed(2)})`;
                this.storeTransform();
                this.resetTransform();
                this.write(20, 30, fps, color, 15, 'Arial');
                this.write(20, 50, vppos, color, 15, 'Arial');
                this.write(20, 70, vpsc, color, 15, 'Arial');
                this.write(20, 90, cdim, color, 15, 'Arial');
                this.write(20, 110, mpos, color, 15, 'Arial');
                this.restoreTransform();
            }
                    
        }
    },

    /** ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== 
     * User input
     */
    Input: {

        _handler: null,

        _justUpKeys: {},

        _justDownKeys: {},
        
        _keys: {},

        _mouse: {
            x: 0,
            y: 0,
            moveX: 0,
            moveY: 0,
            xInCanvas: 0,
            yInCanvas: 0,
            left: false,
            middle: false,
            right: false,
            justDownLeft: false,
            justDownMiddle: false,
            justDownRight: false,
            justUpLeft: false,
            justUpMiddle: false,
            justUpRight: false,
            draggedEntity: null,
        },

        

        init(canvasHandler = null) {
            
            this._handler = canvasHandler;

            // mouse listeners
            document.onmousemove = e => {
                Mx.Input._mouse.x = e.x;
                Mx.Input._mouse.moveX = e.movementX;
                Mx.Input._mouse.y = e.y;
                Mx.Input._mouse.moveY = e.movementY;
                if(!!canvasHandler) {
                    Mx.Input._mouse.xInCanvas = (e.x - canvasHandler.vpX) / canvasHandler.vpScale - canvasHandler.parent.clientLeft;
                    Mx.Input._mouse.yInCanvas = (e.y - canvasHandler.vpY) / canvasHandler.vpScale - canvasHandler.parent.clientTop;
                }
            };

            document.onmousedown = e => {
                switch(e.button) {
                    case 0: 
                        Mx.Input._mouse.left = true; 
                        Mx.Input._mouse.justDownLeft = true;
                        break;
                    case 1: 
                        Mx.Input._mouse.middle = true; 
                        Mx.Input._mouse.justDownMiddle = true;
                        break;
                    case 2: 
                        Mx.Input._mouse.right = true; 
                        Mx.Input._mouse.justDownRight = true; 
                        break;
					default: 
                        break;
                }
            };

            document.onmouseup = e => {
                switch(e.button) {
                    case 0: 
                        Mx.Input._mouse.left = false; 
                        Mx.Input._mouse.justUpLeft = true; 
                        break;
                    case 1: 
                        Mx.Input._mouse.middle = false; 
                        Mx.Input._mouse.justUpMiddle = true; 
                        break;
                    case 2: 
                        Mx.Input._mouse.right = false; 
                        Mx.Input._mouse.justUpRight = true; 
                        break;
					default: break;
                }
            };

            // key listeners
            document.onkeydown = (e) => {
                Mx.Input._keys[e.code] = true;
                Mx.Input._justDownKeys[e.code] = true;

            };
            document.onkeyup = (e) => {
                Mx.Input._keys[e.code] = false;
                Mx.Input._justUpKeys[e.code] = true;
            };

            // disable context menu on right click
            document.oncontextmenu = () => false;
            return this;
        },

        create(canvasHandler = null) {
            return Mx.Input.init(canvasHandler);
        },

        keys() {
           return this._keys;
        },

        isDown(code) {
            return this._keys[code];
        },

        isJustDown(code) {
            return this._justDownKeys[code];
        },

        isJustUp(code) {
            return this._justUpKeys[code];
        },

        mouse() {
            return this._mouse;
        },

        mouseDown() {
            return (
                this._mouse.left || 
                this._mouse.middle || 
                this._mouse.right
            );
        },

        mouseJustUp() {
            return (
                this._mouse.justUpLeft || 
                this._mouse.justUpMiddle || 
                this._mouse.justUpRight
            );
        },

        mouseJustDown() {
            return (
                this._mouse.justDownLeft || 
                this._mouse.justDownMiddle || 
                this._mouse.justDownRight
            );
        },

        update() {
            const handler = Mx.Input._handler;
            if(!handler) {
                return;
            }
            const {x, y} = Mx.Input._mouse;
            Mx.Input._mouse.xInCanvas = (x - handler.vpX) / handler.vpScale - handler.parent.clientLeft;
            Mx.Input._mouse.yInCanvas = (y - handler.vpY) / handler.vpScale - handler.parent.clientTop;
            return this;
        },

        _clearJustUpAndDown() {
            this._justDownKeys = {};
            this._justUpKeys = {};
            this._mouse.justDownLeft = false;
            this._mouse.justDownMiddle = false;
            this._mouse.justDownRight = false;
            this._mouse.justUpLeft = false;
            this._mouse.justUpMiddle = false;
            this._mouse.justUpRight = false;
        }

    },

    /** ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== 
     * Audio instance handler
     */
    AudioHandler : class {

        static create(fileUrl) {
            return new Mx.AudioHandler(fileUrl);
        }

        constructor(fileUrl){
            this.src = fileUrl;
            this.audio = new Audio(fileUrl);
        }
    
        play(){
            this.audio.play();
            return this;
        }

        volume(vol) {
            this.audio.volume = Gmt.clamp(vol, 0, 1);
            return this;
        }

        rate(rate) {
            if(rate < 0) {
                return this.pause();
            }
            this.audio.playbackRate = rate;
            return this;
        }
    
        pause(){
            this.audio.pause();
            return this;
        }
    
        time(time){
            this.audio.currentTime = time;
            return this;
        }

        rewind(){
           return this.time(0);
        }

        reset(){
            return this.volume(1).rate(1).rewind().pause();
        }

        source(src) {
            this.src = src;
            this.audio = new Audio(src);
            return this;
        }
    
        isOn(){     
            return !this.audio.paused();
        }

        getDuration() {
            return this.audio.duration;
        }
    },

    /** ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== 
     * Premade component entities
     */
    Gui: {
        
        GuiComponent: _GuiComponent,

        // TODO finish this
        Button: class extends _GuiComponent {

            construct() {
                // preset values
                const bw = this.options.width || 100;
                const bh = this.options.height || 40;
                const bcol = this.options.backgroundColor || Mx.Draw.Color.rgb(30, 30, 30);
                const hcol = this.options.hoverColor || Mx.Draw.Color.rgb(50, 50, 50);
                const acol = this.options.activeColor || Mx.Draw.Color.rgb(70, 70, 70);
                const tval = this.options.text || 'Button';
                const tcol = this.options.textColor || Mx.Draw.Color.rgb(255, 255, 255);
                const tsize = this.options.fontSize || 30;
                const tfont = this.options.fontFamily || 'Arial';
                const action = this.options.action || (() => {});
                // elements
                const body = Mx.Geo.Rectangle.create(this.x, this.y, bw, bh, bcol);
                const text = Mx.Text.create(this.x + bw/2, this.y + (bh + tsize * 0.8)/2 , tval, tcol, tsize, tfont, 0, 1, 'center');
                this.container.adds(body, text);
                // events
                this.on('over', mouse => {
                    body.backgroundColor = hcol;
                }).on('out', mouse => {
                    body.backgroundColor = bcol;
                }).on('down', mouse => {
                    body.backgroundColor = acol;
                }).on('up', mouse => {
                    body.backgroundColor = bcol;
                    action(mouse);
                });
            }
        }

    },

    /** ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== 
     * 
     */
    Layer: class {

        static of(entities = []) {
            return this.create({entities});
        }

        static create(options = {}) {
            return new this(options);
        }

        constructor(options = {}) {
            this.vpX = options.vpX || undefined;
            this.vpY = options.vpY || undefined;
            this.vpScale = options.vpScale || undefined;
            this.alpha = options.alpha || undefined;
            this.hidden = options.hidden || false;
            this.muted = options.muted || false;
            this.paused = options.paused || false;
            this.entities = options.entities || [];
        }

        cull() {
            this.entities = this.entities.filter(e => !e.expired);
            return this;
        }

        cullIfNthFrame(loop, n) {
            if(loop.tickCount % n === 0) {
                this.cull();
            }
            return this;
        }

        scaleToSize(handler, targetWidth = 800, targetHeight = 600) {
            const {width, height} = handler.canvas;
            const scale = Math.min(width/targetWidth, height/targetHeight);
            this.setViewportScale(scale);
            return this;
        }

        center(hadler) {
            this.align(hadler, 0.5, 0.5);
            return this;
        }

        align(handler, xRatio = 0, yRatio = 0) {
            const {width, height} = handler.canvas;
            this.setViewportPosition(width * xRatio, height * yRatio);
            return this;
        }

        moveViewport(x, y) {
            this.vpX = (this.vpX || 0) + x;
            this.vpY = (this.vpY || 0) + y;
            return this;
        } 

        setViewportPosition(x, y) {
            this.vpX = x;
            this.vpY = y;
            return this;
        }

        scaleViewport(scale) {
            this.vpScale = (this.vpScale || 1) * scale;
            return this;
        }

        setViewportScale(scale) {
            this.vpScale = scale;
            return this;
        }

        unanchorViewport() {
            this.vpX = undefined;
            this.vpY = undefined;
            this.vpScale = undefined;
            return this;
        }
        
        add(element) {
            this.entities.push(element);
            return this;
        }

        adds(elements) {
            for(let element of elements) {
                this.entities.push(element);
            }
            return this;
        }

        empty() {
            this.entities = [];
            return this;
        }

        hide() {
            this.hidden = true;
            return this;
        }

        show() {
            this.hidden = false;
            return this;
        }

        pause() {
            this.paused = true;
            return this;
        }

        unpause() {
            this.paused = false;
            return this;
        }

        mute() {
            this.muted = true;
            return this;
        }

        unmute() {
            this.muted = false;
            return this;
        }

        _isAnchored() {
            return (
                this.vpX !== undefined ||
                this.vpY !== undefined ||
                this.vpScale !== undefined
            );
        }

        _beforeHandle(canvasHandler) {
            if(this._isAnchored()) {
                canvasHandler.storeTransform();
                canvasHandler.resetTransform();
                canvasHandler.moveViewport(this.vpX || 0, this.vpY || 0);
                canvasHandler.scaleViewport(this.vpScale || 1);
            }
            canvasHandler.setAlpha(this.alpha || 1);
        }

        _afterHandle(canvasHandler) {
            if(this._isAnchored()) {
                canvasHandler.resetTransform();
                canvasHandler.restoreTransform();
            }
            canvasHandler.restoreAlpha();
        }

        handleDraw(canvasHandler) {
            if(this.hidden) {
                return this;
            }
            this._beforeHandle(canvasHandler);
            for(let i = 0; i < this.entities.length; i++) {
                const e = this.entities[i];
                canvasHandler.draw(e);
                
            }  
            if(!this.paused) {
                for(let i = 0; i < this.entities.length; i++) {
                    const e = this.entities[i];
                    e.update();
                    e.animate();
                    e.travel();     
                }  
            }
            this._afterHandle(canvasHandler);
            return this;
        }

        handleListen(canvasHandler) {
            if(this.hidden || this.muted) {
                return this;
            }
            this._beforeHandle(canvasHandler);
            for(let i = this.entities.length - 1; i >= 0; i--) {
                const e = this.entities[i];
                e.listen();
            }
            this._afterHandle(canvasHandler);
            return this;
        }

        handle(canvasHandler) {
            this.handleDraw(canvasHandler);
            this.handleListen(canvasHandler);
            return this;
        }


    },

    /** ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== 
     * 
     */
    View: class {

        constructor(game) {
            this.game = game;
            this.handler = game.handler;
            this.loop = game.loop;
            this.input = game.input;
        }
        
        onCreate() {
            // abstract
        }

        onUpdate() {
            // abstract
        }

        onResize() {
            // abstract
        }

        _resize() {
            this.onResize();
        }

        _create() {
            this.onCreate();
        }

        _update() {
            this.onUpdate();
        }

    },

    /** ===== ===== ===== ===== ===== ===== ===== ===== ===== ===== 
     * Application bootstrap tools
     */
    Game: class {

        static create(options = {}) {
            return new Mx.Game(options);
        }

        constructor(options = {}) {
            this.options = options;
            this.handler = Mx.Draw.CanvasHandler.create();
            this.input = Mx.Input.create(this.handler);
            this.loop = Mx.It.Loop.start(options.fps || 60, () => this._update());
            this.state = options.state || {};
            this.view;
            this._createDefaultViewIfNeeded();
        }
        
        _createDefaultViewIfNeeded() {
            const {onCreate, onResize, onUpdate} = this.options;
            if(!!onCreate || !!onResize || !!onUpdate) {
                const view = new Mx.View(this);
                view.onCreate = onCreate || ((...args) => {});
                view.onResize = onResize || ((...args) => {});
                view.onUpdate = onUpdate || ((...args) => {});
                view._create();
                this.handler.clearListeners();
                this.view = view;
                this.handler.on('resize', () => this._refit());
                this._refit()
            }
        }

        _refit() {
            if(!!this.view) {
                this.view._resize();
            }
        }

        toView(ViewClass) {
            this.handler.clearListeners();
            const view = new ViewClass(this);
            view._create();
            this.view = view;
            this.handler.on('resize', () => this._refit());
            this._refit()
            return this;
        }

        _update() {
            if(!!this.view) {
                this.view._update();
            }
        }

    }

}

// enabling node.js imports
if (typeof module === "object" && typeof module.exports === "object") {
    module.exports = Mx;
}