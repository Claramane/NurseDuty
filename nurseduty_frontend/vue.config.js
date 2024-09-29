module.exports = {
  chainWebpack: config => {
    config.plugin('define').tap(args => {
      const env = args[0]['process.env']
      for (let key in env) {
        env[key] = JSON.stringify(env[key])
      }
      return args
    })
  }
}