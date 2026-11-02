// GLSL part 1/8: uniforms (values JS sends each frame), the sky global and the output variable.
// Add a uniform here AND in render/uniforms.js (that is where its starting value is set).

export default /* glsl */`
uniform sampler3D uVoxels;      // the world: one byte per voxel (material id)
uniform sampler3D uCoarse;      // 8^3-voxel bricks: 1 = contains something
uniform sampler3D uSuper;       // 4x4x4 bricks: 1 = contains something (third traversal level)
uniform vec3  uSize;            // world size in voxels
uniform vec3  uCamPos;
uniform vec3  uCamFwd;
uniform vec3  uCamRight;
uniform vec3  uCamUp;
uniform vec2  uRes;             // size of the buffer this pass draws into
uniform float uAspect;          // WINDOW width / height: framing never depends on the internal resolution
uniform float uTanHalf;         // tan(vertical fov / 2)
uniform float uTime;
uniform float uLevels;          // colour levels per channel after dithering
uniform float uAmbient;         // ambient light strength
uniform float uSoft;            // shadow jitter radius (voxels) -> soft shadows
uniform float uDither;          // dither strength: 0 = banding, 1 = full Bayer
uniform float uInvScale;        // 1 / voxelsPerMetre: converts voxel distances to metres
uniform float uBlock;           // size (voxels) of the blocky colour-variation cells
uniform float uMarkerR;         // radius (voxels) of the glowing ball drawn at each light
uniform vec3  uPalette[12];
uniform vec3  uLightPos[8];     // voxel coordinates
uniform vec3  uLightCol[8];     // colour * intensity
uniform int   uLightCount;
uniform vec3  uSunDir;          // see game/sky.js
uniform vec3  uMoonDir;
uniform vec3  uCelLightDir;     // the one directional light that is on (sun by day, moon by night)
uniform vec3  uCelLightCol;     // its colour * intensity (0 at the horizon)
uniform vec3  uSkyAmb;          // ambient light from open sky
uniform vec3  uZenith;
uniform vec3  uHorizon;
uniform vec3  uDusk;            // warm glow around the sun at sunrise / sunset
uniform vec3  uSunDisc;
uniform float uNight;           // 0 day .. 1 night: star visibility
uniform vec2  uSkyRot;          // cos, sin of the star-field rotation
uniform sampler2D uLightTex;    // light pass output (see LIGHT_PASS in main())
uniform vec2  uResLow;          // size of that texture

float gSky = 0.0;               // sky visibility of the last lit surface (0 indoors): drives distance fog colour

`;
