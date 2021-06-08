const p = require('phin');
const scripts = require('script-tags');
const moment = require('moment');
const ObjectsToCsv = require('objects-to-csv');

const lat = -123.494257;
const lng = 48.452279;
const distance = 17; // meters
const height = 11; // meters
const dst_offset = -7;

const mock_exedata = [
  [ 'Date', 'd-m-y'],
  [ 'Sunshine', 'hh:mm', 'Elevation angle', 'Azimuth angle' ],
  [ 'begin of sunshine', '06:45', '0.44', '81.1' ],
  [ 'end of sunshine', '10:15', '33.29', '123.94' ],
  [ 'begin of sunshine', '16:30', '30.18', '241.16' ],
  [ 'end of sunshine', '19:45', '-0.61', '279.97' ],
  [ '<font color=blue>sunshine hours</font>', '06:45', , ] // empty item intentional
];

async function fetch_raw_exedata(day, month, year){
  const res = await p({
    url: 'https://keisan.casio.com/exec/system/14527311044369',
    method: 'POST',
    parse: 'string',
    form: {
      var_λ: lat,
      var_φ: lng,
      var_rem1: 0,
      var_I: dst_offset,
      var_DST: 0,
      var_M: month,
      var_D: day,
      var_Y: year,
      var_Bd: distance,
      var_Bh: height
    }
  });

  script_tags = scripts(res.body);
  let exe_tag;

  for (const i in script_tags){    
    if(script_tags[i].html.indexOf('exedata') == 0){
      exe_tag = script_tags[i].html
      break;
    }
  }

  exe_parts = exe_tag.split(';')
  eval(exe_parts[0])

  // Prepend date
  exedata.splice(0,0,['Date', `${day}-${month}-${year}`])
  return exedata
}

function exedata_to_row(exedata){
  const row = {
    date: "",
    begin1: "",
    end1: "",
    begin2: "",
    end2: "",
    total: ""
  };

  if(exedata.length >= 5){
    // Days with a split sun cycle
    row.date = exedata[0][1]
    // Skip the title row [1]...
    row.begin1 = exedata[2][1]
    row.end1 = exedata[3][1]
    row.begin2 = exedata[4][1]
    row.end2 = exedata[5][1]
    row.total = exedata[6][1]
  } else {
    // Days with a full sun cycle
    row.date = exedata[0][1]
    // Skip the title row [1]...
    row.begin1 = exedata[2][1]
    row.end1 = exedata[3][1]
    row.total = exedata[4][1]
  }
  return row
}

(async () => {
  let data = [];

  const a = moment('2021-01-01');
  const b = moment('2022-01-01');

  for (var m = moment(a); m.isBefore(b); m.add(1, 'days')) {
    console.log('registered', m.format('YYYY-MM-DD'))
    exe_data = await fetch_raw_exedata(m.format('DD'), m.format('MM'), m.format('YYYY'))
    
    //exe_data = mock_exedata;
    console.log(exe_data)

    row = exedata_to_row(exe_data)
    data.push(row)
  }
  
  console.log(data)

  const csv = new ObjectsToCsv(data);
  await csv.toDisk('./2021-11height.csv');

  

})();
