attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aTextureCoords;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

uniform mat3 uNMatrix;

varying vec2 vTextureCoords;
varying highp vec3 vNormal;
varying vec3 vSurfaceWorldPosition;

void main() {
    vec4 surfacePos = uModelViewMatrix * vec4(aVertexPosition, 1);

    vNormal = normalize(uNMatrix * aVertexNormal);
    vSurfaceWorldPosition = surfacePos.xyz;
    vTextureCoords = aTextureCoords;

    gl_Position = uProjectionMatrix * surfacePos;
}