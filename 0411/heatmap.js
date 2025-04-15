const canvas = document.getElementById('canvas');
const gl = canvas.getContext('webgl');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// ===== 工具函数 =====
function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
  }
  return shader;
}

function createProgram(gl, vsSource, fsSource) {
  const program = gl.createProgram();
  const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
  }
  return program;
}

// ===== Shader：绘制模糊点 =====
// 顶点着色器
const drawPointVS = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0, 1);
}
`;
// 片段着色器：绘制一个模糊的白色光斑
const drawPointFS = `
precision mediump float;
uniform vec2 u_center;
uniform float u_radius;
uniform float u_intensity;
void main() {
  vec2 uv = gl_FragCoord.xy;
  float d = distance(uv, u_center);
  float alpha = smoothstep(u_radius, 0.0, d);
  gl_FragColor = vec4(1.0, 1.0, 1.0, alpha * u_intensity);
}
`;
const drawProgram = createProgram(gl, drawPointVS, drawPointFS);

// ===== Shader：灰度转彩色 =====
// 顶点着色器：计算纹理坐标
const colorizeVS = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = (a_position + 1.0) * 0.5;
  gl_Position = vec4(a_position, 0, 1);
}
`;
// 片段着色器：读取 FBO 中的灰度数据并上色
const colorizeFS = `
precision mediump float;
varying vec2 v_uv;
uniform sampler2D u_heatmap;

// 高级六色渐变：蓝→青→绿→黄→橙→红
vec3 colorMap(float t) {
    if (t < 0.2) {
        return mix(vec3(0.0, 0.0, 1.0), vec3(0.0, 1.0, 1.0), t / 0.2);
    } else if (t < 0.4) {
        return mix(vec3(0.0, 1.0, 1.0), vec3(0.0, 1.0, 0.0), (t - 0.2) / 0.2);
    } else if (t < 0.6) {
        return mix(vec3(0.0, 1.0, 0.0), vec3(1.0, 1.0, 0.0), (t - 0.4) / 0.2);
    } else if (t < 0.8) {
        return mix(vec3(1.0, 1.0, 0.0), vec3(1.0, 0.5, 0.0), (t - 0.6) / 0.2);
    } else {
        return mix(vec3(1.0, 0.5, 0.0), vec3(1.0, 0.0, 0.0), (t - 0.8) / 0.2);
    }
}

void main() {
    float intensity = texture2D(u_heatmap, v_uv).r;
    intensity = clamp(intensity, 0.0, 1.0); // 限制到 [0, 1] 范围
    vec3 color = colorMap(intensity);
    gl_FragColor = vec4(color, 1.0);
}
`;
const colorizeProgram = createProgram(gl, colorizeVS, colorizeFS);

// ===== 创建 Framebuffer (FBO) =====
const heatmapTexture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, heatmapTexture);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0,
              gl.RGBA, gl.UNSIGNED_BYTE, null);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

const fbo = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
                        gl.TEXTURE_2D, heatmapTexture, 0);

// ===== 设置全屏 quad =====
const vertices = new Float32Array([
  -1, -1,
   1, -1,
  -1,  1,
  -1,  1,
   1, -1,
   1,  1,
]);
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

// ===== 数据 & 核心函数 =====

// 初始热力点数据（你可以在这里修改或删除已有点）
let myPoints = [
  { x: 300, y: 400, value: 1.0 },
  { x: 500, y: 200, value: 0.5 },
  { x: 700, y: 600, value: 1.2 },
  { x: 800, y: 300, value: 0.8 },
  { x: 400, y: 100, value: 0.9 },
];

// 核心绘制函数：先绘制到 FBO，再上色输出到屏幕
function drawHeatmap(points, radius = 80) {
  // --- Pass 1：绘制所有热力点到 FBO ---
  // 清屏时使用透明背景（alpha = 0）
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  
  gl.useProgram(drawProgram);
  const centerLocation = gl.getUniformLocation(drawProgram, 'u_center');
  const radiusLocation = gl.getUniformLocation(drawProgram, 'u_radius');
  const intensityLocation = gl.getUniformLocation(drawProgram, 'u_intensity');
  const positionLocation = gl.getAttribLocation(drawProgram, 'a_position');
  
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
  
  // 启用混合，采用累加模式
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE);
  
  for (let p of points) {
    // 注意：WebGL 坐标系与 HTML 坐标系在 y 方向相反
    gl.uniform2f(centerLocation, p.x, canvas.height - p.y);
    gl.uniform1f(radiusLocation, radius);
    gl.uniform1f(intensityLocation, p.value);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  // --- Pass 2：使用 FBO 内容，上色绘制到屏幕 ---
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  
  gl.useProgram(colorizeProgram);
  const posLoc = gl.getAttribLocation(colorizeProgram, 'a_position');
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
  
  const heatmapLoc = gl.getUniformLocation(colorizeProgram, 'u_heatmap');
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, heatmapTexture);
  gl.uniform1i(heatmapLoc, 0);
  
  gl.disable(gl.BLEND);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

// 初次绘制
drawHeatmap(myPoints, 60);

// ===== 鼠标交互：点击添加新的热力点 =====
canvas.addEventListener('click', function(e) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  // 添加一个新的点，强度设为 1.0
  myPoints.push({ x: x, y: y, value: 1.0 });
  drawHeatmap(myPoints, 60);
});
