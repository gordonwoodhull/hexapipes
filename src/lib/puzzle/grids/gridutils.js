import {scale, skew, rotate, translate, compose, inverse, applyToPoint} from 'transformation-matrix';

export function getTransformationMatrix(transform) {
    let {scaleX, scaleY, skewX, skewY, rotateTh, translateX, translateY} = transform;
    scaleX = scaleX || 1;
    scaleY = scaleY || 1;
    skewX = skewX || 0;
    skewY = skewY || 0;
    rotateTh = rotateTh || 0;
    translateX = translateX || 0;
    translateY = translateY || 0;
    //const mat = compose(scale(scaleX, scaleY), skew(skewX, skewY), rotate(rotateTh), translate(translateX, translateY))
    return compose(translate(translateX, translateY), rotate(rotateTh), skew(skewX, skewY), scale(scaleX, scaleY));
}

export function getPolygonGestureCoords(mat, tile_x, tile_y, x1, x2, y1, y2) {
    const matInv = inverse(mat);
    const gridTileDownPt = {
        x: x1 - tile_x,
        y: y1 - tile_y
    };
    const gridTileUpPt = {
        x: x2 - tile_x,
        y: y2 - tile_y
    };
    const polygonDownPt = applyToPoint(matInv, gridTileDownPt);
    const polygonUpPt = applyToPoint(matInv, gridTileUpPt);
    return [polygonDownPt.x, polygonUpPt.x, -polygonDownPt.y, -polygonUpPt.y]
}