import { scale, skew, rotate, translate, compose, inverse, applyToPoint } from 'transformation-matrix';

export function getTransformationMatrix(transform) {
    let {scaleX, scaleY, skewX, skewY, rotateTh, translateX, translateY} = transform;
    scaleX = scaleX || 1;
    scaleY = scaleY || 1;
    skewX = skewX || 0;
    skewY = skewY || 0;
    rotateTh = rotateTh || 0;
    translateX = translateX || 0;
    translateY = translateY || 0;
    return compose(translate(translateX, translateY), rotate(rotateTh), skew(skewX, skewY), scale(scaleX, scaleY));
}

export function getPolygonGestureCoords(mat, tileX, tileY, x1, x2, y1, y2) {
    const matInv = inverse(mat);
    const gridTileDownPt = {
        x: x1 - tileX,
        y: y1 - tileY
    };
    const gridTileUpPt = {
        x: x2 - tileX,
        y: y2 - tileY
    };
    const polygonDownPt = applyToPoint(matInv, gridTileDownPt);
    const polygonUpPt = applyToPoint(matInv, gridTileUpPt);
    return [polygonDownPt.x, polygonUpPt.x, -polygonDownPt.y, -polygonUpPt.y]
}

export function getPolygonCoords(mat, point) {
    const { x, y, tileX, tileY } = point;
    const matInv = inverse(mat);
    const polyPt = applyToPoint(matInv, {
        x: x - tileX,
        y: tileY - y
    });
    return [polyPt.x, polyPt.y];
}
