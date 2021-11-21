// Pixels to SVG: https://codepen.io/shshaw/pen/XbxvNj

interface Img {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

export const imgToSvg = (img: Img) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function each(obj: any, fn: any) {
    const length = obj.length,
      likeArray = length === 0 || (length > 0 && length - 1 in obj);
    let i: string | number = 0;

    if (likeArray) {
      for (; i < length; i++) {
        if (fn.call(obj[i], i, obj[i]) === false) {
          break;
        }
      }
    } else {
      for (i in obj) {
        if (fn.call(obj[i], i, obj[i]) === false) {
          break;
        }
      }
    }
  }

  function componentToHex(c: string) {
    const hex = parseInt(c).toString(16);
    return hex.length == 1 ? '0' + hex : hex;
  }

  function getColor(r: string, g: string, b: string, a: string) {
    const parsedA = parseInt(a);
    if (parsedA === undefined || parsedA === 255) {
      return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b);
    }
    if (parsedA === 0) {
      return false;
    }
    return 'rgba(' + r + ',' + g + ',' + b + ',' + parsedA / 255 + ')';
  }

  // Optimized for horizontal lines
  function makePathData(x: number, y: number, w: number) {
    return `M${x} ${y}h${w}`;
  }
  function makePath(color: string, data: string) {
    return `<path stroke='${color}' d='${data}' />`;
  }

  function colorsToPaths(colors: { [key: string]: number[] }) {
    let output = '';

    // Loop through each color to build paths
    each(colors, function (color: string, values: number[]) {
      const colorSplited = color.split(',');
      const colorRGBA = getColor(
        colorSplited[0],
        colorSplited[1],
        colorSplited[2],
        colorSplited[3]
      );

      if (colorRGBA === false) {
        return;
      }

      const paths = [];
      let curPath: number[] = [];
      let w = 1;

      // Loops through each color's pixels to optimize paths
      each(values, function () {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if (curPath && this[1] === curPath[1] && this[0] === curPath[0] + w) {
          w++;
        } else {
          if (curPath && curPath.length > 0) {
            paths.push(makePathData(curPath[0], curPath[1], w));
            w = 1;
          }
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          curPath = this;
        }
      });

      paths.push(makePathData(curPath[0], curPath[1], w)); // Finish last path
      output += makePath(colorRGBA, paths.join(''));
    });

    return output;
  }

  const getColors = function (img: Img) {
    const colors: { [key: string]: [number, number] } = {},
      data = img.data,
      len = data.length,
      w = img.width;
    let x = 0,
      y = 0,
      i = 0,
      color = '';

    for (; i < len; i += 4) {
      if (data[i + 3] > 0) {
        color =
          data[i] + ',' + data[i + 1] + ',' + data[i + 2] + ',' + data[i + 3];
        colors[color] = colors[color] || [];
        x = (i / 4) % w;
        y = Math.floor(i / 4 / w);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        colors[color].push([x, y]);
      }
    }

    return colors;
  };

  const colors = getColors(img);
  const paths = colorsToPaths(colors);
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 -0.5 ${img.width} ${img.height}' shape-rendering='crispEdges'>${paths}</svg>`;
};
