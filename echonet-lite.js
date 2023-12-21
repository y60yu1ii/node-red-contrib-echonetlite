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
        toggleDevice();
        msg.payload = {
          text: `msg has ${location} original payload is ${msg.payload}`,
        };
        node.send(msg);
      }
    });
  }
  // to register the echonet-lite function as a node
  RED.nodes.registerType("echonet-lite", EchonetLiteNode, {});

  var EchonetLite = require("node-echonet-lite");
  var el = new EchonetLite({ type: "lan" });
  // Initialize the EchonetLite object
  el.init((err) => {
    if (err) {
      // An error was occurred
      showErrorExit(err);
    } else {
      // // Start to discover devices
      // discoverDevices();
    }
  });

  function toggleDevice() {
    if (el) {
      discoverDevices();
    }
  }
  // Start to discover devices
  function discoverDevices() {
    // Start to discover Echonet Lite devices
    el.startDiscovery((err, res) => {
      // Error handling
      if (err) {
        showErrorExit(err);
      }
      // Determine the type of the found device
      var device = res["device"];
      var address = device["address"];
      var eoj = device["eoj"][0];
      var group_code = eoj[0]; // Class group code
      var class_code = eoj[1]; // Class code
      console.log(`Found ${JSON.stringify(device)} at ${address}`);
      if (group_code === 0x01 && class_code === 0x30) {
        // Stop to discovery process
        el.stopDiscovery();
        // This means that the found device belongs to the home air conditioner class
        // Get the operation status
        getOperationStatus(address, eoj);

        el.getPropertyValue(address, eoj, 0xbb, (err, res) => {
          console.log("- Property value:");
          console.dir(res["message"]["data"]);
        });
      }
    });
  }

  // Get the operation status
  function getOperationStatus(address, eoj) {
    var epc = 0x80; // An property code which means the operation status
    el.getPropertyValue(address, eoj, epc, (err, res) => {
      // this value is true if the air conditione is on
      var status = res["message"]["data"]["status"];
      var desc = status ? "on" : "off";
      console.log("The air conditioner is " + desc + ".");
      // Toggle the status of the operation status
      changePowerStatus(address, eoj, epc, !status);
    });
  }

  // Change the status of the operation status
  function changePowerStatus(address, eoj, epc, status) {
    var edt = { status: status };
    el.setPropertyValue(address, eoj, epc, edt, (err, res) => {
      var desc = status ? "on" : "off";
      console.log("The air conditionaer was turned " + desc + ".");
      el.close(() => {
        console.log("Closed.");
        // This script terminates here.
      });
    });
  }

  // Print an error then terminate the process of this script
  function showErrorExit(err) {
    console.log("[ERROR] " + err.toString());
    process.exit();
  }
};
