import sphereVS from './Shaders/sphereVS.glsl';
import sphereFS from './Shaders/sphereFS.glsl';

import sphere from './Object/sphere.js';
import bump from './Image/bump.png';
import {OBJ} from "webgl-obj-loader";
import * as glm from "gl-matrix"

var gl; // глобальная переменная для контекста WebGL

var shaderProgram;

// Attributes
var vertexPositionAttribute;
var vertexColorUniform;
var vertexNormalAttribute;

// Uniforms
var projectionMatrixUniform;
var modelviewMatrixUniform;
var LightWorldPositionUniform;
var LightCoeffUniform;
var DistQuadCoeffUniform;
var TextureSizeUniform;

var AmbientLightColorUniform;
var DiffuseLightColorUniform;
var SpecularLightColorUniform;

var NMatrixUniform;

var projectionMatrix;
var modelViewMatrix;

var bumpmapTex;

var meshes;

function initWebGL(canvas) {
    gl = null;
    try { 
    gl = canvas.getContext("webgl2") || canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    }
    catch(e) {}
    if (!gl) { 
    alert("Не удалось инициализировать WebGL. Ваш браузер может не поддерживать это.");
    gl = null;
    }
    return gl;
}

function start() {
    let canvas = document.getElementById("glcanvas");

    gl = initWebGL(canvas);     
    if (gl) {
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;

        gl.clearColor(0.0, 0.0, 0.0, 1.0);  
        gl.enable(gl.DEPTH_TEST);                               
        gl.depthFunc(gl.LEQUAL);                                
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);  
    }
}

function initShaderProgram() {

    const vertexShader = loadShader(gl.VERTEX_SHADER, sphereVS);
    const fragmentShader = loadShader(gl.FRAGMENT_SHADER, sphereFS);

  
    shaderProgram = gl.createProgram(); //создаем программу

    gl.attachShader(shaderProgram, vertexShader); //связываем шейдеры к ней
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram); //связываем программу с контекстом webgl
    
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert('Не удается инициализировать шейдерную программу: ' + gl.getProgramInfoLog(shaderProgram));
        return null;
    }

    //установка атрибутов и юниформ программы();
    vertexPositionAttribute = gl.getAttribLocation(shaderProgram, 'aVertexPosition');
    vertexColorUniform = gl.getUniformLocation(shaderProgram, 'uVertexColor');
    vertexNormalAttribute = gl.getAttribLocation(shaderProgram, 'aVertexNormal');

    projectionMatrixUniform = gl.getUniformLocation(shaderProgram, 'uProjectionMatrix');
    modelviewMatrixUniform = gl.getUniformLocation(shaderProgram, 'uModelViewMatrix');

    LightWorldPositionUniform = gl.getUniformLocation(shaderProgram, 'uLightWorldPosition');

    LightCoeffUniform = gl.getUniformLocation(shaderProgram, 'uLightCoeff');
    DistQuadCoeffUniform = gl.getUniformLocation(shaderProgram, 'uDistQuadCoeff');
    NMatrixUniform = gl.getUniformLocation(shaderProgram, 'uNMatrix');

    AmbientLightColorUniform = gl.getUniformLocation(shaderProgram, 'uAmbientLightColor'); //Окружающий
    DiffuseLightColorUniform = gl.getUniformLocation(shaderProgram, 'uDiffuseLightColor');
    SpecularLightColorUniform = gl.getUniformLocation(shaderProgram, 'uSpecularLightColor'); //поверхностынй

    TextureSizeUniform = gl.getUniformLocation(shaderProgram,"uTextSize");

    gl.useProgram(shaderProgram);

    return shaderProgram;
}


function loadShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert('Произошла ошибка при компиляции шейдеров: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}
//загрузка текс
function setupTextures(){
    bumpmapTex = gl.createTexture();
    setTexture([bump], [bumpmapTex]); //bump imrort in bummapTex установка текстуры
}
//далекк
//утсановка динамически текстуру
function setTexture(urls, textures) { 
    for(let i = 0; i < urls.length; i++){
        gl.bindTexture(gl.TEXTURE_2D, textures[i]); //связывает текстуру с webgl api
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, //определяет 2d изображение
            new Uint8Array([0, 0, 255, 255]));

        let image = new Image();
        image.onload = function() {
            handleTextureLoaded(image, textures[i]); // 
        }
        image.src = urls[i];

        gl.uniform1i(gl.getUniformLocation(shaderProgram, "uSampler"+i), i); //устанавливает значение для постоянных переменных Uniform.
        // getunifol получение местоположения юниформ (непрозрачный идентификатор, используемый для указания места в памяти графического процессора, где находится эта юниформ-переменная)
    }
}

function handleTextureLoaded(image, texture) {
    gl.bindTexture(gl.TEXTURE_2D, texture); //связывает текс с webgl
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); //ределяет режимы хранения пикселей //Если установлено значение true, переворачивает исходные данные вдоль вертикальной оси.
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    if (isPowerOf2(image.width) && isPowerOf2(image.height)) { //проверяем, что размер изображения равен степени двойки в обоих измерениях
        gl.generateMipmap(gl.TEXTURE_2D); //  генерирует набор MIP-карт (для объектов которые дальше и ближев зависимости от качества)
    } else {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); //установка параметра для текстуры (target, pname, param)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
}

function isPowerOf2(value) {
    return (value & (value - 1)) === 0;
}

function loadOBJ(){
    // загрузить mesh(сетка) из OBJ-файла
    meshes = new OBJ.Mesh(sphere);

    OBJ.initMeshBuffers(gl, meshes);

    for (let i=0; i<meshes.vertices.length; ++i) {
        meshes.vertices[i] *= 7; //
    }
}

function initBuffers(){
    // инициализировать позиции 
    gl.bindBuffer(gl.ARRAY_BUFFER, meshes.vertexBuffer);
    gl.vertexAttribPointer(vertexPositionAttribute, meshes.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vertexPositionAttribute);

    // инициализировать индексы вершин 
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, meshes.indexBuffer);

    // инициализировать цвета 
    let color = [255/255, 136/255, 0]; //цвета
    gl.uniform3fv(vertexColorUniform, color)

    // инициализировать вершины нормали 
    gl.bindBuffer(gl.ARRAY_BUFFER, meshes.normalBuffer);
    gl.vertexAttribPointer(vertexNormalAttribute, meshes.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vertexNormalAttribute);

    // инициализировать внормальную матрицу
    let nMatrix = glm.mat3.create();

    glm.mat3.normalFromMat4(nMatrix, modelViewMatrix)
    gl.uniformMatrix3fv(NMatrixUniform,false,nMatrix)

    //инициализировать текстуры (bump map)
    gl.bindBuffer(gl.ARRAY_BUFFER, meshes.textureBuffer);
    const aTextCoords = gl.getAttribLocation(shaderProgram,"aTextureCoords");
    gl.vertexAttribPointer(aTextCoords, meshes.textureBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aTextCoords);

    gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D, bumpmapTex);
    gl.uniform1i(gl.getUniformLocation(shaderProgram, "uSampler0"), 0);

    gl.uniform1f(LightCoeffUniform, LightCoeff);
    gl.uniform1f(DistQuadCoeffUniform, DistQuadCoeff);
    gl.uniform2fv(TextureSizeUniform,[256,256]); //условно шершавость 

    gl.uniform3fv(AmbientLightColorUniform,[0.1,0.1,0.1]) //свет
    gl.uniform3fv(DiffuseLightColorUniform,[0.7,0.7,0.7])
    gl.uniform3fv(SpecularLightColorUniform,[1.0,1.0,1.0])
}

//параметры
var posOfShpere = [0,0,-4.0];
var SphereRotX = 0;
var SphereRotY = 0;

var lightPos = [-1,1,-2];

var LightCoeff = 5.0;
var DistQuadCoeff = 1.0;

function initPMVMatrix(pos, rotX, rotY){
    const fieldOfView = 45 * Math.PI / 180; // В радианах
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 500.0;
    projectionMatrix = glm.mat4.create();
    glm.mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

    modelViewMatrix = glm.mat4.create();

    // translation and rotation сферы
    glm.mat4.translate( modelViewMatrix, modelViewMatrix,pos)

    glm.mat4.rotate(modelViewMatrix,  modelViewMatrix,  rotX * Math.PI/180, [0.0, 1.0, 0.0]); 

    glm.mat4.rotate(modelViewMatrix, modelViewMatrix,  rotY * Math.PI/180, [1.0, 0.0, 0.0]); 

    gl.uniformMatrix4fv(projectionMatrixUniform, false, projectionMatrix);

    gl.uniformMatrix4fv(modelviewMatrixUniform, false, modelViewMatrix);

    gl.uniform3fv(LightWorldPositionUniform, lightPos);
}

function drawScene() {
    gl.clearDepth(1.0);
    //gl.enable(gl.DEPTH_TEST);
    //gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //установка атрибутов и юниформ программы();
    vertexPositionAttribute = gl.getAttribLocation(shaderProgram, 'aVertexPosition');
    vertexColorUniform = gl.getUniformLocation(shaderProgram, 'uVertexColor');
    vertexNormalAttribute = gl.getAttribLocation(shaderProgram, 'aVertexNormal');

    projectionMatrixUniform = gl.getUniformLocation(shaderProgram, 'uProjectionMatrix');
    modelviewMatrixUniform = gl.getUniformLocation(shaderProgram, 'uModelViewMatrix');
    LightWorldPositionUniform = gl.getUniformLocation(shaderProgram, 'uLightWorldPosition');

    LightCoeffUniform = gl.getUniformLocation(shaderProgram, 'uLightCoeff');
    DistQuadCoeffUniform = gl.getUniformLocation(shaderProgram, 'uDistQuadCoeff');
    NMatrixUniform = gl.getUniformLocation(shaderProgram, 'uNMatrix');

    AmbientLightColorUniform = gl.getUniformLocation(shaderProgram, 'uAmbientLightColor');
    DiffuseLightColorUniform = gl.getUniformLocation(shaderProgram, 'uDiffuseLightColor');
    SpecularLightColorUniform = gl.getUniformLocation(shaderProgram, 'uSpecularLightColor');

    TextureSizeUniform = gl.getUniformLocation(shaderProgram,"uTextSize");
    
    initPMVMatrix(posOfShpere, SphereRotX, SphereRotY);
    initBuffers();

    gl.drawElements(gl.TRIANGLES, meshes.indexBuffer.numItems,gl.UNSIGNED_SHORT,0); //последнее это тип значение в массиве и байт кратные знач типо
}

//moveSphere
function moveCube(){
    var speedOfRotation = 5; //скорость вращ
    document.addEventListener('keydown', function(event) {
    if (event.code === 'KeyA') {
        SphereRotX -= speedOfRotation;
        drawScene();
    }
    if (event.code === 'KeyD') {
        SphereRotX += speedOfRotation;
        drawScene();
    }
    if (event.code === 'KeyW') {
        SphereRotY -= speedOfRotation;
        drawScene();
    }
    if (event.code === 'KeyS') {
        SphereRotY += speedOfRotation;
        drawScene();
    }
});

}


//Light
function changeLight(){
    document.getElementById('LightCoeff').oninput = () => {
        LightCoeff = Number(document.getElementById('LightCoeff').value);
        drawScene();
    }
    
    document.getElementById('DistQuadCoeff').oninput = () => {
        DistQuadCoeff = Number(document.getElementById('DistQuadCoeff').value);
        drawScene();
    }

}


function main() {
    start();
    initShaderProgram();
    setupTextures();
    loadOBJ();

    moveCube();
    changeLight();

    drawScene();
}

main();