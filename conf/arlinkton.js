module.exports = {
    accept: /.*\.(xml|XML)/,
    tags: [{
        name: "name",
        split: (fileName) => {
            let result = /(?<system>.*_)(?<type>[^_]+_)(?<timestamp>\d+)\..+?$/.exec(fileName);
            let groups = result.groups;
            let tsGroups = /(?<year>\d{4})(?<month>\d{2})(?<day>\d{2}).*/.exec(groups.timestamp).groups;
            return [groups.system, groups.type, tsGroups.year, tsGroups.month, tsGroups.day];
        }
    },{
        name: "date",
        split: (fileName) => {
            if (!fileName.match(/.*_SHPSTATUS_.*/)){
                return false;
            }
            let result = /.*_[^_]+_(?<timestamp>\d+)\..+$/.exec(fileName);
            let groups = /(?<year>\d{4})(?<month>\d{2})(?<day>\d{2})(?<hour>\d{2}).*/.exec(result.groups.timestamp).groups;
            return [groups.year, groups.month, groups.day];
        },
        query: (query) => {
            return query.split("-");
        }
    },{
        name: "shipmentNo",
        type: "xml",
        tagName: "SHIPMENT_NO",
        split: (tagValue, fileName ) => {
            return tagValue.match(/\d{1,2}/g);
        }
    },{
        name: "branchNo",
        type: "xml",
        tagName: "BRANCH_NO",
        split: (tagValue, fileName) => {
            return tagValue;
        }
    }]
};