const fs = require('fs');

const envConfigFile = `export const environment = {
  production: true,
  apiUrl: '${process.env.API_URL || 'https://cvpitch.onrender.com/api/v1'}'
};
`;

const dir = './src/environments';

if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}

fs.writeFileSync(`${dir}/environment.ts`, envConfigFile);
console.log(`Output generated at ${dir}/environment.ts`);
