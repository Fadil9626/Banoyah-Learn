// The blood collection tubes every scenario shares, in the CLSI order of draw.
module.exports = {
  citrate:  { name: "Light blue top", add: "sodium citrate 3.2%",    for: "clotting tests such as PT/INR and APTT", cap: "#79b8e6", short: "Citrate",  blood: "whole" },
  plain:    { name: "Red top",        add: "no additive",            for: "serology and blood grouping",           cap: "#c0392b", short: "Plain",    blood: "serum" },
  sst:      { name: "Gold top",       add: "clot activator and gel", for: "chemistry such as U&E and LFT",         cap: "#e2b23a", short: "SST",      blood: "serum", gel: true },
  heparin:  { name: "Green top",      add: "lithium heparin",        for: "plasma chemistry",                      cap: "#2e8b57", short: "Heparin",  blood: "whole" },
  edta:     { name: "Purple top",     add: "K2-EDTA",                for: "a full blood count",                    cap: "#7d4cc2", short: "EDTA",     blood: "whole" },
  fluoride: { name: "Grey top",       add: "fluoride oxalate",       for: "glucose",                               cap: "#8d979c", short: "Fluoride", blood: "whole" },
};
