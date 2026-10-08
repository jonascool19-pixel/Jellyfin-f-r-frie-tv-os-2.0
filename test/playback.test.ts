import {chooseSource,secondsToTicks,ticksToSeconds} from '../src/api/playback';

describe('playback helpers',()=>{
  test('converts Jellyfin ticks and seconds',()=>{
    expect(ticksToSeconds(10000000)).toBe(1);
    expect(secondsToTicks(12.5)).toBe(125000000);
  });
  test('prefers direct play over other sources',()=>{
    const result=chooseSource([
      {Id:'transcode',SupportsTranscoding:true},
      {Id:'stream',SupportsDirectStream:true},
      {Id:'play',SupportsDirectPlay:true}
    ]);
    expect(result?.Id).toBe('play');
  });
});
