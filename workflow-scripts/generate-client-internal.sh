set -e

echo "Creating workspace"
mkdir /app
cd /app

echo "Copying files"
cp --verbose /source/* /source/.[^.]* . || true
cp --verbose -r /source/src .           || true

echo "Installing dependencies"
npm clean-install

echo "Building client"
npm start

echo "Copying output"
rm /output/*
cp -r /app/output/* /output

echo "Client generated in /output"