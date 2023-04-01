/**
 * Rotate an array a certain amount
 * @param {Array<any>} a
 * @param {Number} n
 */
export function rotateArray (a, n) {
    n %= a.length;
    let ret = a;
    // if you want to be tricky, i guess you could use -Math.abs(n) and no if
    if (n < 0) {
        ret = [...a.slice(n), ...a.slice(0, n)]
    } else if (n > 0) {
        ret = [...a.slice(-n), ...a.slice(0, -n)]
    }
    return ret;
}
