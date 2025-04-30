precision highp float;

uniform sampler2D uSampler0;

uniform vec3 uLightWorldPosition;

uniform vec3 uVertexColor;

uniform float uLightCoeff;
uniform float uDistQuadCoeff;

uniform vec3 uAmbientLightColor;
uniform vec3 uDiffuseLightColor;
uniform vec3 uSpecularLightColor;

uniform vec2 uTextSize;

varying vec2 vTextureCoords;
varying highp vec3 vNormal;
varying vec3 vSurfaceWorldPosition;

void main() {
    vec3 Light;

    vec4 rp = texture2D(uSampler0, vec2(vTextureCoords.x + 1.0 / uTextSize[0], vTextureCoords.y));
    vec4 lp = texture2D(uSampler0, vec2(vTextureCoords.x - 1.0 / uTextSize[0], vTextureCoords.y));
    vec4 up = texture2D(uSampler0, vec2(vTextureCoords.x, vTextureCoords.y + 1.0 / uTextSize[1]));
    vec4 dp = texture2D(uSampler0, vec2(vTextureCoords.x, vTextureCoords.y - 1.0 / uTextSize[1]));
    vec4 xGrad = lp - rp;
    vec4 yGrad = dp - up;
    vec3 oldNormal = normalize(vNormal);
    //vec3 Normal = oldNormal + vTextureCoords.x * xGrad + vTextureCoords.y * yGrad;
    //vec3 Normal = oldNormal + vSurfaceWorldPosition * xGrad + vSurfaceWorldPosition * yGrad;
    vec3 Normal = vec3(oldNormal.x + vTextureCoords.x * xGrad.x, oldNormal.y + vTextureCoords.y * yGrad.x, oldNormal.z);
    vec4 matTex = texture2D(uSampler0, vTextureCoords);

    float dist = distance(uLightWorldPosition, vSurfaceWorldPosition);
    vec3 surfaceToLightDirection = normalize(uLightWorldPosition - vSurfaceWorldPosition);
    float DiffLightDot = max(dot(Normal,surfaceToLightDirection),0.0);
    vec3 reflVec = normalize(reflect(-surfaceToLightDirection,Normal));
    vec3 viewVecEye = -normalize(vSurfaceWorldPosition);
    float materialShininess = 16.0;

    float specLightDot = max(dot(reflVec,viewVecEye),0.0);
    float SpecLightParam = pow(specLightDot, materialShininess);

    Light = uLightCoeff * uAmbientLightColor +
    1.0 / (pow(dist,uDistQuadCoeff)) * (uDiffuseLightColor * DiffLightDot * matTex.rgb + uSpecularLightColor * SpecLightParam);

    gl_FragColor = vec4(Light * uVertexColor,1.0);
}