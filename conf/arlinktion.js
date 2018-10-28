const config = {
    accept: /.*\.(xml|XML)/
    tags: [{
        name: "name",
        split: (fileName) => {
            let result = /(?<system>.*)_(?<type>[^_]+)_(?<timestamp>\d+)\..+$/.exec(fileName);
            let groups = result.groups;
            let tsGroups = /(?<year>\d{4})(?<month>\d{2})(?<day>\d{2}).*/.exec(.timestamp);
            return [groups.system, groups.type, tsGroups.year, tsGroups.month, tsGroups.day];
        }
    },{
        name: "date",
        split: (fileName) => {
            if (!fileName.match(/.*_SHPSTATUS_.*/){
                return false;
            })
            let result = /.*_[^_]+_(?<timestamp>\d+)\..+$/.exec(fileName);
            let groups = /(?<year>\d{4})(?<month>\d{2})(?<day>\d{2})(?<hour>\d{2}).*/.exec(result.groups.timestamp);
            return [groups.year, groups.month, groups.day, groups.hour];
        }
    }]
};