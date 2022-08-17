# D2Closet / drip.report
(Description)

## Standing TODOs:
1. Redirect users entering invalid locations (ie, attempting to go to `/drip/{membershipType}` without the `membershipId`, or attempting to go to `/drip/{membershipType}/{membershipId}/characters` without the `characterId`)
2. Force the manifest to reload at every point, in order to ensure that members that immediately go to a link without using the landing page have access
to the manifest
    - ALTERNATIVELY: Force reload the manifest every time an endpoint that uses it is called, on the API side.
3. Animations for modals
4. Allow the render to resize on page resize
5. Support for dyes
6. Shader support

## Current issues in progress
1. Texture loading; UVs seem to be correct, but the cases 