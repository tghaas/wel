 


#### Watt Node

Main electric uses 150Amp CTs
So the scale factor for `watt_node_Total` is 3

GSHP uses 70Amp CTs so the scale factor of `watt_node_GSHP` is 1.4


### Home Assistant

Need an ENV VAR named `HA_TOKEN` set to the user token for Home Assistant. This is for API access to the Home Assistant instance

### Emporia Energy Monitor

The emporia energy sensor monitors up to 16 circuits plus the mains. It is running esphome on it. The configuration is handled in highmead.yaml. You need to perform a flash to update the config:

```
esphome run highmead.yaml
```