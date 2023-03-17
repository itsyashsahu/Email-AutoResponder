/** @type {import('next').NextConfig} */
const withImages = require('next-images')
// import withImages from "next-images"
const withSvg = require('next-svgr')
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
}


module.exports = withImages(
  withSvg({
    webpack(config, options) {
      config.module.rules.push({
        test: /\.svg$/,
        use: [
          {
            loader: '@svgr/webpack',
            options: {
              svgoConfig: {
                plugins: {
                  removeViewBox: false
                }
              }
            }
          }
        ]
      })

      return config
    }
  })
)


module.exports = nextConfig
