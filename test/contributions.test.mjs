import test from 'node:test';
import assert from 'node:assert/strict';
import { validateSubmission, inspectPullRequest } from '../scripts/check-contribution-pr.mjs';
import { FOUND_FIELDS, toCsv } from '../scripts/lib/csv.mjs';
const row = patch => ({ ...Object.fromEntries(FOUND_FIELDS.map(k => [k, ''])), qid:'Q1',title:'Story',form:'short story',lang:'ru',kind:'audio',site:'Narrator',url:'https://example.org/story',tier:'external',evidence:'Opened matching author/title and player; metadata only; permission unknown',checked_at:'2026-11-03T12:00:00Z',...patch });
const file = rows => ({ filename:'data/found/2026-11-03-reader-batch.csv',status:'added',mode:'100644',content:toCsv(rows) });
const note = { filename:'data/notes/2026-11-03-reader-batch.md',status:'added',mode:'100644',content:'Q1 / PL: searched published title, no audio match; inspect anthology.' };
const catalog = { works:[{qid:'Q1',form:'short story',knownLinks:[]}],data:{works:{Q1:['Story',0,0,['Q9'],0,0,2000]},authors:{Q9:['Author']},ex:{}} };
const source='const READ = {\n};\nconst CHANGELOG = [];';
test('findings accept a bounded CSV and matching note without changing catalog',()=>{
 const before=JSON.stringify(catalog); assert.equal(validateSubmission([file([row()]),note],catalog,source).rows,1); assert.equal(JSON.stringify(catalog),before);
 assert.equal(validateSubmission([note],catalog,source).notes_only,true);
 assert.equal(validateSubmission([{filename:'src/index.html'}],catalog,source).skipped,true);
});
test('findings cannot edit code, earlier submissions, symlinks or unrelated notes',()=>{
 assert.throws(()=>validateSubmission([file([row()]),{...note,filename:'.github/workflows/ci.yml'}],catalog,source),/Disallowed/);
 assert.throws(()=>validateSubmission([{...file([row()]),status:'modified'}],catalog,source),/new regular/);
 assert.throws(()=>validateSubmission([{...file([row()]),mode:'120000'}],catalog,source),/new regular/);
 assert.throws(()=>validateSubmission([file([row()]),{...note,filename:'data/notes/2026-11-03-other.md'}],catalog,source),/same filename/);
 assert.throws(()=>validateSubmission([{...note,filename:'data/notes/2026-02-31-reader.md'}],catalog,source),/Invalid date/);
});
test('findings validate identities, schema, formats, dates and bounded text',()=>{
 for(const patch of [{qid:'Q999'},{form:'novel'},{kind:'none',url:''},{kind:'full',words:''},{checked_at:'2999-01-01T00:00:00Z'}]) assert.throws(()=>validateSubmission([file([row(patch)])],catalog,source));
 assert.throws(()=>validateSubmission([{...file([row()]),content:toCsv([row()],FOUND_FIELDS.slice().reverse())}],catalog,source),/header/);
 assert.throws(()=>validateSubmission([{...note,content:'x'.repeat(60001)}],catalog,source),/size/);
 assert.throws(()=>validateSubmission([{...note,content:'\0'}],catalog,source),/UTF-8/);
 assert.throws(()=>validateSubmission([file(Array.from({length:31},(_,i)=>row({qid:'Q'+(i+1)})))],catalog,source),/at most 30/);
});
test('thirty-work batches are accepted with bounded notes, while the next work and oversized UTF-8 notes fail',()=>{
 const rows=Array.from({length:30},(_,i)=>row({qid:'Q'+(i+1),url:'https://example.org/story-'+i}));
 const many={works:rows.map(r=>({qid:r.qid,form:r.form,knownLinks:[]})),data:{works:Object.fromEntries(rows.map(r=>[r.qid,['Story',0,0,['Q9'],0,0,2000]])),authors:{Q9:['Author']},ex:{}}};
 assert.equal(validateSubmission([file(rows),{...note,content:'x'.repeat(60000)}],many,source).works,30);
 assert.throws(()=>validateSubmission([file([...rows,row({qid:'Q31'})])],many,source),/at most 30/);
 assert.throws(()=>validateSubmission([{...note,content:'ą'.repeat(30001)}],many,source),/size/);
});
test('findings reject duplicates, credential/local URLs and incomplete multipart sources',()=>{
 assert.throws(()=>validateSubmission([file([row(),row()])],catalog,source),/Duplicate/);
 const known={...catalog,works:[{...catalog.works[0],knownLinks:[{...row()}]}]};
 assert.throws(()=>validateSubmission([file([row()])],known,source),/Duplicate/);
 for(const url of ['http://127.0.0.1/book','http://[::1]/book','https://localhost/book','https://example.org/book?token=secret','javascript:alert(1)']) assert.throws(()=>validateSubmission([file([row({url})])],catalog,source));
 assert.throws(()=>validateSubmission([file([row({part:'2'})])],catalog,source),/incomplete/);
});
const sha='a'.repeat(40),base='b'.repeat(40),blob='c'.repeat(40);
function apiFixture({mode='100644',moved=false,extra=false}={}){
 let reads=0,blobReads=0;
 const api=async path=>{
  if(path.endsWith('/pulls/3')) return {head:{sha:moved&&reads++? 'd'.repeat(40):sha},base:{sha:base},labels:[]};
  if(path.includes('/files?')) return [{filename:'data/found/2026-11-03-reader-batch.csv',status:'added',sha:blob},...(extra?[{filename:'src/index.html',status:'modified',sha:blob}]:[])];
  if(path.includes('/git/trees/'))return {truncated:false,tree:[{path:'data/found/2026-11-03-reader-batch.csv',mode,type:'blob',sha:blob,size:500}]};
  if(path.includes('/git/blobs/')){blobReads++;return {encoding:'base64',size:500,content:Buffer.from(toCsv([row()])).toString('base64')};}
  throw Error('Unexpected API route');
 };
 return {api,blobReads:()=>blobReads};
}
const context={repository:'foteev/unoebasta',number:3,headSha:sha,baseSha:base};
test('PR intake fetches regular data blobs from the exact commit, using no PR checkout',async()=>{
 const {api}=apiFixture(),result=await inspectPullRequest({...context,api});
 assert.equal(validateSubmission(result.files,catalog,source).rows,1);
});
test('PR intake stops before blob reads for code changes or symlinks and rejects moving heads',async()=>{
 for(const options of [{extra:true},{mode:'120000'}]){
  const fixture=apiFixture(options);await assert.rejects(inspectPullRequest({...context,api:fixture.api}));assert.equal(fixture.blobReads(),0);
 }
 await assert.rejects(inspectPullRequest({...context,api:apiFixture({moved:true}).api}),/changed/);
});
