module.exports = function (RED) {
  // echonet-lite node
  function EchonetLiteNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    node.location = config.location;
    node.on("input", function (msg) {
      let location = node.location ? node.location : msg.payload.location;
      if (!location) {
        node.error("missing location", msg);
      } else {
        msg.payload = {
          text: `msg has ${location} original payload is ${msg.payload}`,
        };
        node.send(msg);
      }
    });
  }
  // to register the echonet-lite function as a node
  RED.nodes.registerType("echonet-lite", EchonetLiteNode, {});
};
