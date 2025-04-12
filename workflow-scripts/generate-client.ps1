podman run --rm `
  --volume .:/source:ro `
  --volume ./output:/output `
  --entrypoint /bin/sh `
  node:23-alpine `
  -c 'sh /source/workflow-scripts/generate-client-internal.sh'
