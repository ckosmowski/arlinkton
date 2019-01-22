import DateFileFilter from '../src/DateFileFilter';
import {ComparisonOperator} from '../src/ComparisonOperator';

test('testFillDate', () => {
  const filter: DateFileFilter  = new DateFileFilter("date", null,
    ["2018", "07"], ComparisonOperator.GREATER_THAN);
  let res: string[] = filter.fillDate(["2018", "07"], 3);
  expect(res).toEqual(["2018", "07", "01"]);

  res = filter.fillDate(["2018", "07", "01"], 2);
  expect(res).toEqual(["2018", "07"]);

  res = filter.fillDate(["2018", "07", "12"], 3);
  expect(res).toEqual(["2018", "07", "12"]);

  const original = ["2018", "07", "12"];
  res = filter.fillDate(["2018", "07", "12"], 2);
  expect(res).toEqual(["2018", "07"]);
  expect(original).toEqual(["2018", "07", "12"]);

});
