/* IELTS_WRITING_MODULE_V1: the Writing review module of the IELTS 45–50 pages, shared as one file for classes
   whose page was built without it (IELTS 51+). Presentation only: reads the pupil's sealed ./data/writing cache through
   the page's own ieltsParentAccess; never grades, never writes. */
(function(d){if(d.getElementById('ielts-writing-feedback-style'))return;var st=d.createElement('style');st.id='ielts-writing-feedback-style';
st.textContent=".wr-summary{padding:17px;border:1px solid #cad9ed;border-radius:13px;background:#fff;box-shadow:0 4px 16px #12325708}.wr-summary h4{margin:6px 0;color:#163c64;font-size:16px}.wr-kicker{color:#596f88;font-size:10px;font-weight:850;letter-spacing:.1em;text-transform:uppercase}.wr-summary p{margin:7px 0;color:#52637a;font-size:12px;line-height:1.6}.wr-verdict{display:inline-flex;padding:5px 9px;border-radius:7px;background:#fff1d8;color:#78500b;font-weight:800;font-size:12px}.wr-button{border:0;border-radius:9px;background:#164975;color:white;padding:10px 15px;font:inherit;font-size:12px;font-weight:800;cursor:pointer}.wr-button.secondary{background:#eaf0f7;color:#164975}.wr-summary .wr-button{margin-top:12px}.wr-status{font-size:12px;color:#56677a;padding:10px 0;line-height:1.6}.wr-status button{margin-left:8px}.wr-result-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,285px),1fr));gap:14px}.wr-personal{margin-top:26px}.wr-dialog{width:min(1240px,calc(100vw - 32px));max-width:none;max-height:calc(100dvh - 32px);padding:0;border:1px solid #d0dce9;border-radius:20px;background:#f2f5f9;color:#183956;box-shadow:0 30px 100px #0b264950;overflow:auto}.wr-dialog::backdrop{background:#102440ad;backdrop-filter:blur(3px)}.wr-dialog[open]{display:block}.wr-head{position:sticky;top:0;z-index:3;display:flex;align-items:center;justify-content:space-between;gap:18px;padding:20px 25px;background:#143a60;color:white}.wr-head h2{font-size:21px;margin:4px 0}.wr-head p{margin:0;color:#d1dfec;font-size:12px}.wr-head .wr-kicker{color:#b9d1e9}.wr-close{flex:none;border:1px solid #ffffff50;background:#ffffff10;color:white;border-radius:9px;width:38px;height:38px;font-size:24px;cursor:pointer}.wr-body{padding:22px;display:grid;gap:18px}.wr-top{display:flex;flex-wrap:wrap;gap:8px 20px;align-items:center}.wr-top small{color:#596c82;font-size:12px}.wr-section{padding:21px 23px;border:1px solid #d7e1ec;border-radius:14px;background:#fff;min-width:0}.wr-section h3{font-size:16px;color:#183b62;margin:0 0 12px}.wr-copy{line-height:1.8;font-size:14px;overflow-wrap:anywhere}.wr-copy p{margin:0 0 12px}.wr-copy p:last-child{margin-bottom:0}.wr-context{display:grid;grid-template-columns:1.2fr 1fr;gap:18px}.wr-scope{color:#5a6a7d;font-size:12px;line-height:1.65}.wr-writing{padding:0;overflow:hidden}.wr-writing-head{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:18px 22px;border-bottom:1px solid #dce5ef}.wr-writing-head h3{margin:0;flex-shrink:0}.wr-tabs{display:flex;padding:5px;background:#f0f4f8;border-radius:11px;gap:3px}.wr-tab{font:inherit;font-size:12px;line-height:1.5;border:0;border-radius:8px;background:transparent;color:#60748c;padding:10px 14px;cursor:pointer}.wr-tab[aria-selected=true]{background:#fff;color:#0f5088;box-shadow:0 1px 4px #0b2f5612;font-weight:800}.wr-pane[hidden]{display:none!important}.wr-original-grid{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(285px,.8fr);align-items:start}.wr-essay-col{padding:23px;min-width:0}.wr-essay-hint{font-size:11px;line-height:1.6;color:#607086;margin:0 0 20px}.wr-essay{color:#213e5b;font-size:16px;line-height:2;white-space:pre-wrap;overflow-wrap:anywhere}.wr-mark{display:inline;padding:1px 0;border:0;border-bottom:2px solid #dab151;background:#fff1c9;color:inherit;font:inherit;text-align:inherit;cursor:pointer;border-radius:2px;white-space:inherit}.wr-mark.is-serious{background:#ffe0dd;border-color:#cf6c63}.wr-mark.is-selected{background:#d6e9ff;border-color:#3374aa}.wr-notes{padding:20px;background:#f6f8fb;border-left:1px solid #dce5ef;max-height:780px;overflow:auto}.wr-notes h4{margin:0 0 12px;font-size:13px}.wr-note{margin-bottom:12px;padding:15px;background:#fff;border:1px solid #dce3ed;border-radius:11px;scroll-margin:10px;outline:none}.wr-note.is-selected{border:2px solid #3374aa;padding:14px;box-shadow:0 3px 12px #255b9720}.wr-note.is-serious{border-left:4px solid #bd4f49}.wr-note h5{margin:0 0 10px;font-size:13px;line-height:1.55;color:#183b62}.wr-note .wr-copy{font-size:12px;line-height:1.85}.wr-note-tags{display:flex;flex-wrap:wrap;gap:5px;margin-top:10px}.wr-note-tags span{padding:3px 6px;border-radius:5px;background:#f0f3f7;color:#59667b;font-size:10px;font-weight:750}.wr-note-jump{margin-top:10px;border:0;background:none;color:#1c5d95;padding:0;font-size:11px;cursor:pointer;text-decoration:underline}.wr-revision{padding:25px;max-width:900px;margin:auto}.wr-revision .wr-essay{white-space:normal}.wr-revision .wr-essay p{margin:0 0 20px}.wr-applied{background:#f1f6fb;padding:18px;border-radius:11px;margin-top:20px}.wr-applied h4{font-size:13px;margin:0 0 10px}.wr-applied ul,.wr-next{padding-left:22px;margin:0}.wr-applied li,.wr-next li{margin:8px 0;line-height:1.8}.wr-knowledge{overflow:auto}.wr-knowledge table{width:100%;border-collapse:collapse;text-align:left;font-size:12px;line-height:1.7}.wr-knowledge th{padding:11px;background:#f2f6fb;color:#183b62;vertical-align:top}.wr-knowledge td{padding:12px 11px;border-bottom:1px solid #e5ebf3;vertical-align:top}.wr-knowledge td:first-child{font-weight:700;min-width:160px}.wr-knowledge td:nth-child(2){min-width:155px}.wr-button:focus-visible,.wr-close:focus-visible,.wr-tab:focus-visible,.wr-mark:focus-visible,.wr-note-jump:focus-visible{outline:3px solid #60a3d8;outline-offset:3px}.wr-public-note{margin:12px 0;padding:13px 16px;border:1px solid #d5e0ed;border-radius:10px;background:#f6f9fd;color:#36536f;font-size:12px;line-height:1.7}.wr-public-note strong{display:block;color:#153c65;margin-bottom:3px}\n\n\n\n\n\n\n\n\n\n\n\n@media(max-width:800px){.wr-context{grid-template-columns:1fr}.wr-original-grid{grid-template-columns:1fr}.wr-notes{border-left:0;border-top:1px solid #dce5ef;max-height:none}.wr-writing-head{align-items:flex-start;flex-direction:column}.wr-tabs{width:100%}.wr-tab{flex:1}.wr-dialog{width:calc(100vw - 12px);max-height:calc(100dvh - 12px);border-radius:14px}.wr-body{padding:12px;gap:12px}.wr-head{padding:16px}.wr-head h2{font-size:18px}.wr-section{padding:18px}.wr-writing{padding:0}.wr-essay-col,.wr-revision{padding:20px}.wr-essay{font-size:15px}}\n\n\n\n\n\n\n\n\n\n\n\n.wr-assignment{min-width:0}.wr-feedback-head{padding:0 0 13px;border-bottom:2px solid #cbddeb;margin-bottom:15px}.wr-feedback-head h4{font-size:19px;line-height:1.4;color:#143c63;margin:0 0 4px}.wr-feedback-head p{font-size:12px;line-height:1.6;color:#536981;margin:0}.wr-exercises{display:grid;gap:16px}.wr-summary{min-width:0;overflow-wrap:anywhere}.wr-summary h5{font-size:16px;color:#163c64;line-height:1.5;margin:5px 0}.wr-summary .wr-task-title{font-weight:600;font-size:12px;margin:0 0 10px}.wr-summary .wr-overall{margin-top:14px;color:#23415c;font-size:14px;line-height:1.8}.wr-summary .wr-overall p{font-size:14px;color:inherit;line-height:inherit;margin:0 0 12px}.wr-summary .wr-overall p:last-child{margin-bottom:0}.wr-summary .wr-submitted{border-top:1px solid #e0e7ee;padding-top:11px;margin-top:15px}.wr-pending{background:#f7f9fc;border-style:dashed;box-shadow:none}.wr-pending .wr-status{margin:0;padding:3px 0}.wr-result-list{grid-template-columns:1fr;gap:24px}.wr-prompt h4{font-size:14px;line-height:1.6;margin:0 0 10px;color:#34526f}.wr-prompt-text{font-size:14px;line-height:1.8;white-space:pre-wrap;overflow-wrap:anywhere;color:#23415c}.wr-prompt figure{margin:18px 0 12px;padding:12px;border:1px solid #e0e7ef;border-radius:10px;background:#fff;text-align:center}.wr-prompt-image{display:block;width:auto;max-width:100%;height:auto;max-height:580px;object-fit:contain;margin:0 auto}.wr-source-link{display:inline-block;padding:6px 0;color:#185888;font-size:12px;line-height:1.6;text-decoration:underline;text-underline-offset:3px}.wr-source-link:focus-visible{outline:3px solid #60a3d8;outline-offset:3px}.wr-summary .wr-wrong-task,.wr-wrong-task,.wr-scaffold-label{font-size:13px;font-weight:800;line-height:1.6;color:#924132}.wr-scaffold-label{background:#fff2e4;border:1px solid #eac6a0;border-radius:9px;padding:12px;margin:0 0 15px}\n\n\n\n\n\n\n\n\n\n\n\n@media(max-width:800px){.wr-prompt figure{padding:4px;margin:14px 0 8px}.wr-summary{padding:15px}.wr-feedback-head h4{font-size:18px}.wr-tabs{min-width:0}.wr-tab{min-width:0;overflow-wrap:anywhere}.wr-prompt-text,.wr-summary .wr-overall p{font-size:14px}}\n\n\n\n\n\n\n\n\n\n\n\n.wr-assignment{margin-top:18px;padding:20px;border:1px solid #b9cede;border-radius:17px;background:#edf3f8;box-shadow:0 8px 26px #1232570d}.wr-feedback-head{margin:-20px -20px 20px;padding:18px 20px;background:#143a60;border-radius:16px 16px 0 0;border-bottom:4px solid #dbb05e}.wr-feedback-head h4{color:#fff;font-size:22px;font-weight:850;margin:0 0 5px}.wr-feedback-head p{color:#d9e6f2;font-size:13px}.wr-assignment .wr-summary{padding:21px;border-color:#c7d7e6;border-left:4px solid #d4aa58}.wr-assignment .wr-summary h5{font-size:18px}.wr-assignment .wr-summary .wr-overall,.wr-assignment .wr-summary .wr-overall p{font-size:15px;line-height:1.9}.wr-assignment .wr-pending{border-left-color:#bccbd8;background:#f5f8fb}\n\n\n\n\n\n\n\n\n\n\n\n@media(max-width:600px){.wr-assignment{padding:13px;border-radius:13px}.wr-feedback-head{margin:-13px -13px 14px;padding:16px;border-radius:12px 12px 0 0}.wr-feedback-head h4{font-size:20px}.wr-assignment .wr-summary{padding:16px}.wr-assignment .wr-summary .wr-overall,.wr-assignment .wr-summary .wr-overall p{font-size:14px}}\n\n\n\n\n\n\n\n\n\n\n\n.wr-revision .wr-essay{white-space:pre-wrap}.wr-revision-legend{margin:0 0 20px;padding:11px 14px;border:1px solid #b9d8c9;border-left:4px solid #337f63;border-radius:8px;background:#f0f8f3;color:#28583f;font-size:12px;line-height:1.7}.wr-revision-change{padding:1px 0;border-radius:2px;background:#d9efdf;color:inherit;text-decoration-line:underline;text-decoration-color:#337f63;text-decoration-thickness:1px;text-underline-offset:4px;box-decoration-break:clone;-webkit-box-decoration-break:clone}\n\n\n\n\n\n\n\n\n\n\n\n@media(forced-colors:active){.wr-revision-change{background:Mark;color:MarkText;text-decoration-color:MarkText}.wr-revision-legend{border-color:CanvasText}}\n\n\n\n\n\n\n\n\n\n\n\n.wr-notebook{margin:18px 0;padding:23px 25px;border:1px solid #d3dfec;border-left:6px solid #627b97;border-radius:14px;background:#f4f7fb;overflow-wrap:anywhere;color:#263f58}\n\n\n\n\n\n\n\n\n\n\n\n.wr-notebook h5{font-size:20px;margin:6px 0 13px;font-weight:850;line-height:1.4}.wr-notebook h6{font-size:14px;margin:15px 0 7px;line-height:1.5}.wr-notebook p,.wr-notebook li{font-size:14px;line-height:1.8}.wr-notebook p{margin:7px 0}.wr-notebook ul{padding-left:22px;margin:8px 0 12px}\n\n\n\n\n\n\n\n\n\n\n\n.wr-notebook-blocked{border:2px solid #df7768;border-left:8px solid #b52c20;background:#fff0ed;box-shadow:0 8px 22px #a8322720}.wr-notebook-blocked h5{color:#92261e}.wr-notebook-alert{margin:13px 0 10px;padding:14px 16px;border-radius:10px;background:#b52c20;color:#fff;font-size:16px;line-height:1.55;box-shadow:0 3px 10px #8f1e1633}.wr-notebook-alert strong{display:block}.wr-notebook-reason{margin:0!important;color:#71362f;font-weight:650}.wr-notebook-complete{border-color:#c4e3d7;border-left-color:#258269;background:#eef9f4}.wr-notebook-complete h5{color:#186c54}.wr-notebook-freshness{font-weight:700;color:#5d6470}.wr-notebook-steps{margin-top:18px}.wr-notebook-details{margin-top:16px;padding-top:13px;border-top:1px solid #d9dfe6}.wr-notebook-details summary{font-size:14px;font-weight:750;cursor:pointer}.wr-notebook-issue{padding:7px 0 12px;border-bottom:1px solid #dfe5ed}.wr-notebook-issue:last-child{border-bottom:0}.wr-notebook-action{font-weight:650}.wr-notebook .wr-button{display:inline-flex;margin:10px 8px 0 0;text-decoration:none}.wr-notebook .wr-submitted{font-size:12px;color:#63768b;margin-top:15px}\n\n\n\n\n\n\n\n\n\n\n\n@media(max-width:600px){.wr-notebook{padding:17px 16px}.wr-notebook h5{font-size:18px}}\n\n\n\n\n\n\n\n\n\n\n\n.wr-notebook-quick{padding:17px 20px;border-left-width:4px}.wr-notebook-quick h5{font-size:16px;margin:0 0 7px}.wr-notebook-quick .wr-notebook-details{margin-top:10px;padding-top:9px}.wr-notebook-quick .wr-notebook-hold{font-size:12px;color:#7d4a3d}.wr-notebook-quick summary:focus-visible{outline:3px solid #60a3d8;outline-offset:3px}\n\n\n\n\n\n\n\n\n\n\n\n.wr-policy{padding:22px 24px;border:1px solid #c4d2e0;border-radius:13px;background:#f7f9fc;color:#344f68;overflow-wrap:anywhere}.wr-policy p{margin:8px 0;font-size:14px;line-height:1.8}.wr-policy-too-late{border:2px solid #df7768;border-left:8px solid #b52c20;background:#fff0ed;color:#71362f;box-shadow:0 8px 22px #a8322720}.wr-policy h5{margin:0 0 12px;font-size:20px;line-height:1.5;font-weight:850;color:#92261e}.wr-policy .wr-submitted{margin-top:15px;font-weight:700}.wr-policy-files{display:flex;flex-wrap:wrap;gap:9px;margin-top:17px}.wr-policy-files .wr-button{display:inline-flex;align-items:center;text-decoration:none;min-height:44px;box-sizing:border-box}.wr-policy-unavailable p{margin:0}@media(max-width:600px){.wr-policy{padding:17px 16px}.wr-policy h5{font-size:18px}}\n\n\n\n\n\n\n\n\n\n\n\n.wr-task2-grid{display:grid;gap:16px;grid-template-columns:repeat(2,minmax(0,1fr))}.wr-task2-grid article{padding:20px;border:1px solid #dce5ef;border-radius:14px;overflow-wrap:anywhere}.wr-task2-grid h4{margin:0 0 12px}.wr-task2-grid blockquote{margin:12px 0;padding:8px 14px;border-left:3px solid #6c9cbb;color:#36556b}.wr-task2-grid details,.wr-task2-outline details{margin-top:14px}.wr-task2-grid summary,.wr-task2-outline summary{cursor:pointer;color:#175b89}.wr-task2-grid .wr-verdict{display:inline-block;margin-bottom:8px}@media(max-width:700px){.wr-task2-grid{grid-template-columns:1fr}.wr-task2-grid article{padding:14px}}\n\n\n\n\n\n\n\n\n\n\n\n.hy-result{margin-top:24px;border:1px solid #c4d5e5;border-radius:18px;overflow:hidden;background:#f1f6fa;color:#173b5c}\n\n\n\n\n\n\n\n\n\n\n\n.hy-head{background:#173f62;color:white;padding:22px 26px;border-bottom:4px solid #dfb25d}.hy-head h3{margin:0 0 6px;font-size:26px}.hy-head p{margin:0}\n\n\n\n\n\n\n\n\n\n\n\n.hy-content{padding:24px}.hy-notebook{padding:20px;background:#eef9f4;border:1px solid #bce0d0;border-left:5px solid #25866d;border-radius:16px}.hy-notebook>strong{color:#177361}.hy-notebook details{margin-top:12px}\n\n\n\n\n\n\n\n\n\n\n\n.hy-result summary{cursor:pointer;font-weight:700;line-height:1.6}.hy-essay{margin-top:20px;background:white;border:1px solid #c4d5e5;border-left:5px solid #dfb25d;border-radius:16px;padding:20px}.hy-essay summary{font-size:20px;color:#173f62}.hy-essay h4{font-size:20px;margin:24px 0 10px}.hy-essay blockquote{border-left:3px solid #e2aa54;padding:12px 18px;margin:14px 0;background:#fffaf1}.hy-prose{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.85}.hy-yellow{background:#fff1ac}.hy-blue{background:#dceeff}.hy-green{background:#daf5df}\n\n\n\n\n\n\n\n\n\n\n\n@media(max-width:640px){.hy-content{padding:12px}.hy-head{padding:18px}.hy-essay{padding:14px}.hy-notebook{padding:16px}}";(d.head||d.documentElement).appendChild(st);})(document);
/* IELTS_WRITING_ASSIGNMENTS_MANIFEST_V1 */
window.IELTS_WRITING_ASSIGNMENTS={"schemaVersion":1,"assignments":[{"assignmentCode":"IELTS-WRITING-W09","enabledFromWeek":9,"classNames":["IELTS 48","IELTS 49"],"sessionNumbers":[9],"lessonUrl":"https://mstrangtrieueducation-droid.github.io/vocabulary-reading-web/ielts-writing/20698a99cfb9eedc42902ba85b113111/","lessonAliases":[],"notebook":true,"reviewDriven":false,"tasks":[{"taskNumber":1,"title":"Female members of parliament","promptText":"The line graph below shows the percentages of female members of parliament in five European countries from 2000 to 2012.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.","imageUrl":"https://mstrangtrieueducation-droid.github.io/assets/ielts-writing/w09-de1.png","sourceUrl":"https://drive.google.com/file/d/1iOsck3sFeNMxY7cy8giJI1wADUCAA1-K/view","lessonAliases":[]},{"taskNumber":2,"title":"Reasons for choosing a university","promptText":"The pie charts below show the main reasons why students chose a particular university in the UK in 1997 and 2007.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.","imageUrl":"https://mstrangtrieueducation-droid.github.io/assets/ielts-writing/w09-de2.png","sourceUrl":"https://drive.google.com/file/d/16RgEDAfr5Y-lhp71t9miHyIef7dYUgHw/view","lessonAliases":[]}]},{"assignmentCode":"IELTS-WRITING-W10","enabledFromWeek":10,"classNames":["IELTS 48"],"sessionNumbers":[10],"lessonUrl":"https://mstrangtrieueducation-droid.github.io/vocabulary-reading-web/ielts-writing/3fbd7746cb99cdb6654795d109d739f0/","lessonAliases":[],"notebook":true,"reviewDriven":false,"tasks":[{"taskNumber":1,"title":"Population aged 65 and above","promptText":"The table below shows information and predictions regarding the percentages of the population aged 65 and above in three countries.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.","imageUrl":"https://mstrangtrieueducation-droid.github.io/assets/ielts-writing/w10-de1.png","sourceUrl":"https://drive.google.com/file/d/1Q3uQm1tdCEKBf20h5bK5eJ2wLFbwk0I6/view","lessonAliases":[]}]},{"assignmentCode":"IELTS-WRITING-W28","enabledFromWeek":28,"classNames":["IELTS 46","IELTS 45"],"sessionNumbers":[28],"lessonUrl":"https://sites.google.com/view/w7k4n9t346/buoi-hoc-viet-so-28","lessonAliases":["https://mstrangtrieueducation-droid.github.io/vocabulary-reading-web/ielts-writing/5b26260f94b2555bed933ac3d6d37bc0/"],"notebook":true,"reviewDriven":true,"tasks":[{"taskNumber":1,"title":"Task 2 · Topic 2.2","promptText":"Online shopping is increasing dramatically.\nHow could this trend affect our environment and the kinds of jobs required?\n\nGive reasons for your answer and include any relevant examples from your own knowledge or experience.\nWrite at least 250 words.","sourceUrl":"https://sites.google.com/view/w7k4n9t346/buoi-hoc-viet-so-28","lessonAliases":[]},{"taskNumber":2,"title":"Task 2 · Topic 3.3","promptText":"Some say that news has no connection with most people's lives, and it is a waste of time for most of us to read newspapers and watch television news programs.\nTo what extent do you agree or disagree?\n\nGive reasons for your answer and include any relevant examples from your own knowledge or experience.\nWrite at least 250 words.","sourceUrl":"https://sites.google.com/view/w7k4n9t346/buoi-hoc-viet-so-28","lessonAliases":[]},{"taskNumber":3,"title":"Task 2 · Topic 3.4.1","promptText":"Some people say we do not need printed newspaper anymore.\nTo what extent do you agree or disagree with this opinion?\n\nGive reasons for your answer and include any relevant examples from your own knowledge or experience.\nWrite at least 250 words.","sourceUrl":"https://sites.google.com/view/w7k4n9t346/buoi-hoc-viet-so-28","lessonAliases":[]}]},{"assignmentCode":"IELTS-WRITING-W29","enabledFromWeek":29,"classNames":["IELTS 46","IELTS 45"],"sessionNumbers":[29],"lessonUrl":"https://sites.google.com/view/w7k4n9t346/buoi-hoc-viet-so-29","lessonAliases":["https://mstrangtrieueducation-droid.github.io/vocabulary-reading-web/ielts-writing/82430981005946a2c625cd938e4a5478/"],"notebook":true,"reviewDriven":true,"tasks":[{"taskNumber":1,"title":"Task 2 · Topic 4.2","promptText":"With the rapid development of communication technology; e.g. smart phones, tablets and other mobile devices, some people believe that the disadvantages outweigh the advantages.\nTo what extent do you agree or disagree?\n\nGive reasons for your answer and include any relevant examples from your own knowledge or experience.\nWrite at least 250 words.","sourceUrl":"https://sites.google.com/view/w7k4n9t346/buoi-hoc-viet-so-29","lessonAliases":[]},{"taskNumber":2,"title":"Task 2 · Topic 4.5","promptText":"Some people think that the increasing use of computers and mobile phones for communication has a negative effect on young people’s reading and writing skills.\nTo what extent do you agree or disagree?\n\nGive reasons for your answer and include any relevant examples from your own knowledge or experience.\nWrite at least 250 words.","sourceUrl":"https://sites.google.com/view/w7k4n9t346/buoi-hoc-viet-so-29","lessonAliases":[]},{"taskNumber":3,"title":"Task 2 · Topic 4.6","promptText":"The Internet has transformed the way information is shared and consumed, but it has also created problems that did not exist before.\nWhat are the most serious problems associated with the Internet and what are the possible solutions?\n\nGive reasons for your answer and include any relevant examples from your own knowledge or experience.\nWrite at least 250 words.","sourceUrl":"https://sites.google.com/view/w7k4n9t346/buoi-hoc-viet-so-29","lessonAliases":[]}]},{"assignmentCode":"IELTS-WRITING-W26","enabledFromWeek":26,"classNames":["IELTS 45"],"sessionNumbers":[26],"lessonUrl":"https://mstrangtrieueducation-droid.github.io/vocabulary-reading-web/ielts-writing/2f239909d3c1bcf3a230d4d7c65d2b91/","lessonAliases":[],"notebook":true,"reviewDriven":true,"tasks":[{"taskNumber":1,"title":"Task 2 · Video games","promptText":"Some people regard video games as harmless fun, or even as a useful educational tool. Others, however, believe that video games are having an adverse effect on the people who play them.\nIn your opinion, do the drawbacks of video games outweigh the benefits?\n\nGive reasons for your answer and include any relevant examples from your own knowledge or experience.\nWrite at least 250 words.","lessonAliases":[]},{"taskNumber":2,"title":"Task 2 · Remote areas","promptText":"It is now possible for scientists and tourists to travel to remote areas with natural environments, such as the South Pole.\nIs this a positive or negative development?\n\nGive reasons for your answer and include any relevant examples from your own knowledge or experience.\nWrite at least 250 words.","lessonAliases":[]}]},{"assignmentCode":"IELTS-WRITING-W30","enabledFromWeek":30,"classNames":["IELTS 46"],"sessionNumbers":[30],"lessonUrl":"https://mstrangtrieueducation-droid.github.io/vocabulary-reading-web/ielts-writing/1efea40df9e9bcf8167b8fe197b076e9/","lessonAliases":[],"notebook":true,"reviewDriven":true,"tasks":[{"taskNumber":1,"title":"Task 2 · 7.2","promptText":"Some people believe that reading stories from a book is better than watching TV or playing computer games for children.\nTo what extent do you agree or disagree?\n\nGive reasons for your answer and include any relevant examples from your own knowledge or experience.\nWrite at least 250 words.","lessonAliases":[]},{"taskNumber":2,"title":"Task 2 · 8.1","promptText":"Some people think that studying at university or college is the best way for students to prepare for their future career. Others, however, say today this is no longer true.\nDiscuss both views and give your opinion.\n\nGive reasons for your answer and include any relevant examples from your own knowledge or experience.\nWrite at least 250 words.","lessonAliases":[]},{"taskNumber":3,"title":"Task 2 · 8.5","promptText":"Too much emphasis is placed on going to university for academic education. People should be encouraged to do vocational training, because there is a lack of qualified tradespeople such as electricians or plumbers.\nTo what extent do you agree or disagree?\n\nGive reasons for your answer and include any relevant examples from your own knowledge or experience.\nWrite at least 250 words.","lessonAliases":[]}]},{"assignmentCode":"IELTS-WRITING-W30","enabledFromWeek":30,"classNames":["IELTS 45"],"sessionNumbers":[30],"lessonUrl":"https://mstrangtrieueducation-droid.github.io/vocabulary-reading-web/ielts-writing/1efea40df9e9bcf8167b8fe197b076e9/","lessonAliases":[],"notebook":true,"reviewDriven":true,"tasks":[{"taskNumber":1,"title":"Task 2 · 7.2","promptText":"Some people believe that reading stories from a book is better than watching TV or playing computer games for children.\nTo what extent do you agree or disagree?\n\nGive reasons for your answer and include any relevant examples from your own knowledge or experience.\nWrite at least 250 words.","lessonAliases":[]}]},{"assignmentCode":"IELTS-WRITING-W22","enabledFromWeek":22,"classNames":["IELTS 47"],"sessionNumbers":[22],"lessonUrl":"https://mstrangtrieueducation-droid.github.io/vocabulary-reading-web/ielts-writing/c6d3b342a4bcf298387d6636147fb67f/","lessonAliases":[],"notebook":true,"reviewDriven":true,"tasks":[{"taskNumber":1,"title":"Paraphrase practice","displayLabel":"Bài 1","promptText":"Paraphrase 3 lần cho mỗi câu sau. Mỗi lần sử dụng đa dạng cấu trúc và từ vựng, giữ nguyên 100% ý nghĩa gốc.\n\nA. Many people believe that money is one of the most important factors in achieving happiness.\n\nB. Some people say that the best way to improve public health is by increasing the number of sports facilities. Others, however, believe this would have little effect.","lessonAliases":[]},{"taskNumber":2,"title":"Chuỗi lập luận 1","displayLabel":"Bài 2A","promptText":"Áp dụng các kĩ thuật dựng câu để tạo thành chuỗi lập luận hoàn chỉnh.\n\nprofessional sport events: World Cup or the Olympics - facilitate tourism and related commercial activities → employment opportunities for the locals","lessonAliases":[]},{"taskNumber":3,"title":"Chuỗi lập luận 2","displayLabel":"Bài 2B","promptText":"Áp dụng các kĩ thuật dựng câu để tạo thành chuỗi lập luận hoàn chỉnh.\n\nreading fictional or real-life stories - allow children to have better imagination → reading - conjure up images - a wondrous world; a homeless person’s sufferings; a joyous moment - on their own → boost creativity","lessonAliases":[]}]},{"assignmentCode":"IELTS-WRITING-W12","enabledFromWeek":12,"classNames":["IELTS 48"],"sessionNumbers":[12],"lessonUrl":"https://sites.google.com/view/w7k4n9t346/buoi-hoc-viet-so-12","lessonAliases":[],"notebook":true,"reviewDriven":true,"tasks":[]},{"assignmentCode":"IELTS-WRITING-W31","enabledFromWeek":31,"classNames":["IELTS 46"],"sessionNumbers":[31],"lessonUrl":"https://mstrangtrieueducation-droid.github.io/vocabulary-reading-web/ielts-writing/f6e9cb146d430b51bac5e6e98cad9740/","lessonAliases":[],"notebook":true,"reviewDriven":true,"tasks":[{"taskNumber":1,"title":"Task 2 · Topic 9.2.1","promptText":"The government should invest more money in teaching science than other subjects for a country’s development and progress.\nTo what extent do you agree or disagree?\n\nWrite at least 250 words.","lessonAliases":[]},{"taskNumber":2,"title":"Task 2 · Topic 9.6","promptText":"Many people argue that in order to improve educational quality, high school students should be encouraged to make comments or even criticism on their teachers. Others; however, think it will lead to loss of respect and discipline in the classroom.\nDiscuss both views and give your opinion.\n\nWrite at least 250 words.","lessonAliases":[]},{"taskNumber":3,"title":"Task 2 · Topic 9.9.1","promptText":"Schools are no longer necessary because children can get so much information available through the Internet, and they can study just as well at home.\nTo what extent do you agree or disagree?\n\nWrite at least 250 words.","lessonAliases":[]}]},{"assignmentCode":"IELTS-WRITING-W27","enabledFromWeek":27,"classNames":["IELTS 45"],"sessionNumbers":[27],"lessonUrl":"https://mstrangtrieueducation-droid.github.io/vocabulary-reading-web/ielts-writing/3a85d2d66d1be5524eec264643991ea5/","lessonAliases":[],"notebook":true,"reviewDriven":false,"tasks":[{"taskNumber":1,"title":"Topic 1.1","promptText":"If a product is good or meets people’s needs, they will buy it. Therefore, advertising is unnecessary and no more than entertainment. \u000bTo what extent do you agree or disagree?","sourceUrl":"https://mstrangtrieueducation-droid.github.io/vocabulary-reading-web/ielts-writing/3a85d2d66d1be5524eec264643991ea5/","lessonAliases":[]},{"taskNumber":2,"title":"Topic 1.3","promptText":"Today, the high sales of popular consumer goods reflect the power of advertising and not the real needs of the society in which they are sold.\nTo what extent do you agree or disagree?","sourceUrl":"https://mstrangtrieueducation-droid.github.io/vocabulary-reading-web/ielts-writing/3a85d2d66d1be5524eec264643991ea5/","lessonAliases":[]},{"taskNumber":3,"title":"Topic 1.6","promptText":"Research indicates that nowadays some consumers are much less influenced by advertising than in the past.\nWhat are the reasons for this trend?\nDo you think this is a positive or negative development?","sourceUrl":"https://mstrangtrieueducation-droid.github.io/vocabulary-reading-web/ielts-writing/3a85d2d66d1be5524eec264643991ea5/","lessonAliases":[]}]},{"assignmentCode":"IELTS-WRITING-W07","enabledFromWeek":7,"classNames":["IELTS 49"],"sessionNumbers":[7],"lessonUrl":"https://mstrangtrieueducation-droid.github.io/vocabulary-reading-web/ielts-writing/c84809a951127d85acfe55b893e70254/","lessonAliases":[],"notebook":true,"reviewDriven":false,"tasks":[{"taskNumber":1,"title":"Car production","promptText":"The table below shows the number of cars made in three countries in 2003, 2006 and 2009.\n\nSummarize the information by selecting and reporting the main features, and make comparisons where relevant.","imageUrl":"https://mstrangtrieueducation-droid.github.io/assets/ielts-writing/w07-de1.png","sourceUrl":"https://mstrangtrieueducation-droid.github.io/vocabulary-reading-web/ielts-writing/c84809a951127d85acfe55b893e70254/","lessonAliases":[]},{"taskNumber":2,"title":"Prison population","promptText":"You should spend about 20 minutes on this task.\n\nThe line graph shows the prison population in a European country between 1911 and 2001.\n\nSummarize the information by selecting and reporting the main features, and make comparisons where relevant.\n\nWrite at least 150 words.","imageUrl":"https://mstrangtrieueducation-droid.github.io/assets/ielts-writing/w07-de2.png","sourceUrl":"https://mstrangtrieueducation-droid.github.io/vocabulary-reading-web/ielts-writing/c84809a951127d85acfe55b893e70254/","lessonAliases":[]}]},{"assignmentCode":"IELTS-WRITING-W05","enabledFromWeek":5,"classNames":["IELTS 50"],"sessionNumbers":[5],"lessonAliases":[],"notebook":true,"reviewDriven":false,"tasks":[]},{"assignmentCode":"IELTS-WRITING-W06","enabledFromWeek":6,"classNames":["IELTS 49"],"sessionNumbers":[6],"lessonAliases":[],"notebook":true,"reviewDriven":false,"tasks":[]},{"assignmentCode":"IELTS-WRITING-W23","enabledFromWeek":23,"classNames":["IELTS 47"],"sessionNumbers":[23],"lessonUrl":"https://mstrangtrieueducation-droid.github.io/vocabulary-reading-web/ielts-writing/7215608aba86392dc505990fd6d2cc9e/","lessonAliases":[],"notebook":true,"reviewDriven":false,"tasks":[{"taskNumber":1,"title":"Advertising: positive or negative development","promptText":"Advertisements are becoming more and more common in our everyday life.\nIs it a positive or negative development?\n\nWrite at least 250 words.","lessonAliases":[]}]},{"assignmentCode":"IELTS-WRITING-W13","enabledFromWeek":13,"classNames":["IELTS 48"],"sessionNumbers":[13],"lessonUrl":"https://mstrangtrieueducation-droid.github.io/vocabulary-reading-web/ielts-writing/35ed60d173560cc633f5c5f4d632fe9f/","lessonAliases":[],"notebook":true,"reviewDriven":false,"tasks":[{"taskNumber":1,"title":"Most common sports in the United Kingdom","promptText":"The chart below gives information about the most common sports played in the UK in 2008.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.","imageUrl":"https://mstrangtrieueducation-droid.github.io/assets/ielts-writing/w13-de1.png","sourceUrl":"https://mstrangtrieueducation-droid.github.io/vocabulary-reading-web/ielts-writing/35ed60d173560cc633f5c5f4d632fe9f/","lessonAliases":[]},{"taskNumber":2,"title":"Annual pay for doctors and other workers","promptText":"The chart below shows the annual pay, in thousands of US dollars, for doctors and other workers in seven countries in 2004.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.","imageUrl":"https://mstrangtrieueducation-droid.github.io/assets/ielts-writing/w13-de2.png","sourceUrl":"https://mstrangtrieueducation-droid.github.io/vocabulary-reading-web/ielts-writing/35ed60d173560cc633f5c5f4d632fe9f/","lessonAliases":[]}]},{"assignmentCode":"IELTS-WRITING-W24","enabledFromWeek":24,"classNames":["IELTS 47"],"sessionNumbers":[24],"lessonUrl":"https://mstrangtrieueducation-droid.github.io/vocabulary-reading-web/ielts-writing/82c0b2f0b706e850a6e623364ae196be/","lessonAliases":[],"notebook":true,"reviewDriven":false,"tasks":[{"taskNumber":1,"title":"Media good news","promptText":"The media should include more stories which report good news.\nTo what extent do you agree or disagree?\n\nWrite at least 250 words.","lessonAliases":[]},{"taskNumber":2,"title":"Contacting intelligent life","promptText":"Some scientists think there are intelligent life forms on other planets and messages should be sent to contact them. Other scientists think it is a bad idea and would be dangerous.\nDiscuss both views and give your opinion.\n\nWrite at least 250 words.","lessonAliases":[]}]},{"assignmentCode":"IELTS-WRITING-W33","enabledFromWeek":33,"classNames":["IELTS 46"],"sessionNumbers":[33],"lessonUrl":"https://mstrangtrieueducation-droid.github.io/vocabulary-reading-web/ielts-writing/a12eb8d32454da6111c618c3fc10297c/","lessonAliases":[],"notebook":true,"reviewDriven":false,"tasks":[{"taskNumber":1,"title":"Topic 10.1.6","promptText":"In today’s world of advanced science and technology, people still greatly value artists such as musicians, writers, and painters.\nWhat can the arts tell us about life that science and technology cannot?","sourceUrl":"https://mstrangtrieueducation-droid.github.io/vocabulary-reading-web/ielts-writing/a12eb8d32454da6111c618c3fc10297c/","lessonAliases":[]},{"taskNumber":2,"title":"Topic 10.2.1","promptText":"Some people think history has nothing or little to tell us, but others think that studying the past can help us better understand the present.\nDiscuss both views and give your opinion.","sourceUrl":"https://mstrangtrieueducation-droid.github.io/vocabulary-reading-web/ielts-writing/a12eb8d32454da6111c618c3fc10297c/","lessonAliases":[]},{"taskNumber":3,"title":"Topic 10.4","promptText":"Most people have forgotten the meaning behind traditional or religious festivals; during festival periods, people nowadays only want to enjoy themselves.\nTo what extent do you agree or disagree with this opinion?","sourceUrl":"https://mstrangtrieueducation-droid.github.io/vocabulary-reading-web/ielts-writing/a12eb8d32454da6111c618c3fc10297c/","lessonAliases":[]}]},{"preferredReviewDelivery":"native","assignmentCode":"IELTS-WRITING-W14","classNames":["IELTS 48"],"sessionNumbers":[14],"enabled":true,"autoGrade":true,"lessonAliases":[],"notebook":true,"reviewDriven":true,"tasks":[{"taskNumber":1,"title":"Writing Task 1","promptText":"The table below shows the percentage of first-year students who gave a 'very good' rating to the resources provided by the college for three courses. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.","imageUrl":"https://mstrangtrieueducation-droid.github.io/assets/ielts-writing/w14-de1.png","lessonAliases":[],"enabled":true,"autoGrade":true},{"taskNumber":2,"title":"Writing Task 1","promptText":"The table shows the number of universities ranked in the world's top 200 in 2011 in three subjects in five countries. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.","imageUrl":"https://mstrangtrieueducation-droid.github.io/assets/ielts-writing/w14-de2.png","lessonAliases":[],"enabled":true,"autoGrade":true}]},{"assignmentCode":"IELTS-WRITING-W08","enabledFromWeek":8,"classNames":["IELTS 49"],"sessionNumbers":[8],"lessonAliases":[],"notebook":true,"reviewDriven":true,"tasks":[{"taskNumber":1,"title":"Task 1 · Meat and fish consumption","promptText":"The line graph below shows the consumption of fish and four different kinds of meat in a European country between 1979 and 2004.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.","imageUrl":"https://mstrangtrieueducation-droid.github.io/assets/ielts-writing/w08-de1.png","lessonAliases":[]},{"taskNumber":2,"title":"Task 1 · Higher education","promptText":"The bar chart below shows the percentages of young people in higher education in four countries in 2000, 2005 and 2010.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.","imageUrl":"https://mstrangtrieueducation-droid.github.io/assets/ielts-writing/w08-de2.png","lessonAliases":[]}]},{"assignmentCode":"IELTS-WRITING-W25","enabledFromWeek":25,"classNames":["IELTS 47"],"sessionNumbers":[25],"lessonUrl":"https://mstrangtrieueducation-droid.github.io/vocabulary-reading-web/ielts-writing/32927ac0fb9fd9921de593e159a8de20/","lessonAliases":[],"notebook":true,"reviewDriven":true,"tasks":[{"taskNumber":1,"title":"Advertising: harmful effects and solutions","promptText":"Some people believe that powerful advertising can be harmful to individuals.\nIn what ways can advertising negatively affect people?\nWhat solutions can be implemented to minimize its harmful effects?\n\nWrite at least 250 words.","lessonAliases":[]}]}]};
/* IELTS_WRITING_ASSIGNMENT_HELPERS_V1: shared, public assignment metadata only. */
const ieltsWritingAssignments_ = (() => {
  'use strict';
  const array = value => Array.isArray(value) ? value : [];
  function code(value) {
    const text = String(value || '').normalize('NFC').trim().toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const match = text.match(/^(?:IELTS-)?WRITING-W0*(\d{1,3})(?:-.*)?$/);
    return match ? 'IELTS-WRITING-W' + String(Number(match[1])).padStart(2, '0') : '';
  }
  function safeUrl(value) {
    try {
      if (!String(value || '').trim()) return '';
      const url = new URL(String(value), document.baseURI);
      return url.protocol === 'https:' && !url.username && !url.password ? url.href : '';
    } catch (_) { return ''; }
  }
  function lessonKey(value) {
    const safe = safeUrl(value); if (!safe) return '';
    let url = new URL(safe);
    // The classroom viewer carries a lesson URL plus private prefill hints.
    // Match only the lesson; never treat the shared viewer path as one lesson.
    if (url.origin === 'https://mstrangtrieueducation-droid.github.io' && /^\/student-learning(?:\/|$)/.test(url.pathname)) {
      const lessons = url.searchParams.getAll('lesson');
      if (!/^\/student-learning(?:\/index\.html|\/)?$/.test(url.pathname) || lessons.length !== 1) return '';
      const nested = safeUrl(lessons[0]); if (!nested) return '';
      url = new URL(nested);
      if (url.origin === 'https://mstrangtrieueducation-droid.github.io' && /^\/student-learning(?:\/|$)/.test(url.pathname)) return '';
    }
    return url.origin + url.pathname.replace(/\/+$/, '');
  }
  function currentClass() {
    return String(typeof ieltsParentAccess !== 'undefined' ? ieltsParentAccess.className : typeof state !== 'undefined' && state.dashboard ? state.dashboard.className : '').trim();
  }
  function all(className = currentClass()) {
    const manifest = window.IELTS_WRITING_ASSIGNMENTS;
    const entries = Array.isArray(manifest) ? manifest : array(manifest && manifest.assignments);
    const groups = new Map();
    entries.forEach(entry => {
      if (!entry || entry.enabled === false || entry.autoGrade === false) return;
      if (!array(entry.classNames).includes(className)) return;
      const assignmentCode = code(entry.assignmentCode);
      const week = Number(assignmentCode.match(/W(\d+)$/)?.[1]);
      const notebook = entry.notebook === true;
      const enabledFromWeek = Number(entry.enabledFromWeek || (notebook ? 5 : 9));
      if (!assignmentCode || !Number.isFinite(enabledFromWeek) || week < Math.max(notebook ? 5 : 9, enabledFromWeek)) return;
      if (notebook && !groups.has(assignmentCode)) {
        groups.set(assignmentCode, {assignmentCode, weekCode:'W' + String(week).padStart(2, '0'), notebook:true,
          lessonUrls:[entry.lessonUrl,...array(entry.lessonAliases)].map(lessonKey).filter(Boolean),
          sessionNumbers:array(entry.sessionNumbers).map(Number).filter(Number.isFinite), preferredReviewDelivery:entry.preferredReviewDelivery, reviewDriven:entry.reviewDriven===true, tasks:[]});
      }
      if (notebook) groups.get(assignmentCode).notebook = true;
      const tasks = Array.isArray(entry.tasks) ? entry.tasks : [entry];
      tasks.forEach(task => {
        if (!task || task.enabled === false || task.autoGrade === false) return;
        const taskNumber = Number(task.taskNumber);
        if (!Number.isInteger(taskNumber) || taskNumber < 1 || taskNumber > 50) return;
        let group = groups.get(assignmentCode);
        if (!group) {
          group = {assignmentCode, weekCode:'W' + String(week).padStart(2, '0'), notebook:false, preferredReviewDelivery:entry.preferredReviewDelivery, reviewDriven:entry.reviewDriven===true,
            lessonUrls:[], sessionNumbers:array(entry.sessionNumbers).map(Number).filter(Number.isFinite), tasks:[]};
          groups.set(assignmentCode, group);
        }
        [entry.lessonUrl, ...array(entry.lessonAliases), task.lessonUrl, ...array(task.lessonAliases)].map(lessonKey).filter(Boolean).forEach(url => {
          if (!group.lessonUrls.includes(url)) group.lessonUrls.push(url);
        });
        if (group.tasks.some(existing => existing.taskNumber === taskNumber)) return;
        group.tasks.push({taskNumber, displayLabel:String(task.displayLabel || ''), title:String(task.title || ''), promptText:String(task.promptText || ''),
          imageUrl:safeUrl(task.imageUrl), sourceUrl:safeUrl(task.sourceUrl || entry.sourceUrl || task.lessonUrl || entry.lessonUrl)});
      });
    });
    return [...groups.values()].map(group => ({...group, tasks:group.tasks.sort((a,b) => a.taskNumber-b.taskNumber)}));
  }
  function forItem(item) {
    if (!item || item.skill !== 'writing') return null;
    const values = [item.assignmentCode, item.sourceCode, item.code];
    const urls = [item.lessonUrl, item.url];
    array(item.tasks).forEach(task => {
      if (!task) return;
      values.push(task.assignmentCode, task.sourceCode, task.code, task.title);
      urls.push(task.url, task.lessonUrl);
      array(task.actions).forEach(action => { if (action) urls.push(action.url); });
    });
    const codes = [...new Set(values.map(code).filter(Boolean))];
    // An explicit code is authoritative; a lesson link cannot override it.
    if (codes.length) return codes.length === 1 ? all().find(entry => entry.assignmentCode === codes[0]) || null : null;
    const keys = urls.map(lessonKey).filter(Boolean);
    const matches = all().filter(entry => entry.lessonUrls.some(url => keys.includes(url)));
    if (matches.length === 1) return matches[0];
    const sessionNumber = Number(item.sessionNumber);
    const sessionMatches = Number.isFinite(sessionNumber) ? all().filter(entry => entry.sessionNumbers.includes(sessionNumber)) : [];
    return sessionMatches.length === 1 ? sessionMatches[0] : null;
  }
  return {code, all, forItem, safeUrl};
})();
/* IELTS_WRITING_ASSIGNMENT_HELPERS_END_V1 */
/* IELTS_HYBRID_PARENT_BRIDGE_V1: only authenticated private tracker pointers. */
const ieltsHybridReviews_ = (() => {
  'use strict';
  const ORIGIN='https://mstrangtrieueducation-droid.github.io';
  const cache=new Map(); let epoch=0;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const inline=v=>esc(v).replace(/\*\*([^*\n]+)\*\*/g,'<strong>$1</strong>');
  const prose=v=>'<p class="hy-prose">'+inline(v)+'</p>';
  const normal=v=>String(v||'').normalize('NFC').trim().replace(/\s+/g,' ').toLocaleUpperCase('vi');
  function identity(){return parentState.authorized&&!parentState.locked&&parentState.name?[ieltsParentAccess.className,parentState.revision,normal(parentState.name)].join('|'):'';}
  function clear(){epoch++;cache.clear();document.querySelectorAll('[data-hybrid-result]').forEach(n=>n.replaceChildren());}
  const b64=v=>Uint8Array.from(atob(v.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-v.length%4)%4)),c=>c.charCodeAt(0));
  function pointer(text){
    // The legacy feedback typography inserts spaces after full stops, including
    // domain/path dots. Normalize only for parsing the allowlisted pointer;
    // never rewrite saved feedback or display prose.
    text=text.replace(/\.\s+/g,'.');
    const found=[...text.matchAll(/https:\/\/mstrangtrieueducation-droid\.github\.io\/ielts-writing-grader\/index\.html#[A-Za-z0-9_=&%-]+/g)];
    if(found.length!==1)return null;
    const url=new URL(found[0][0]),p=new URLSearchParams(url.hash.slice(1));
    if([...p.keys()].sort().join(',')!=='a,k,p,s'||!/^IELTS-WRITING-W\d{2,3}$/.test(p.get('a'))||!/^\d+$/.test(p.get('s'))||! /^[a-f0-9]{64}$/.test(p.get('p'))||! /^[A-Za-z0-9_-]{43}$/.test(p.get('k')))return null;
    return {url:url.href,profile:p.get('p'),secret:p.get('k'),code:p.get('a'),student:p.get('s')};
  }
  function validate(data,ref){
    const p=data?.schema_version===1&&data.assignments?.[ref.code];
    if(!p||p.schema_version!==1||p.class_name!==ieltsParentAccess.className||normal(p.student_name)!==normal(parentState.name)||String(p.student_id)!==ref.student||p.task_code!==ref.code||!Array.isArray(p.essays)||!['graded','too_late','notebook_failed','pending','missing','notebook_pass'].includes(p.state))throw Error('Private result identity mismatch');
    if(p.state!=='graded'&&p.essays.length)throw Error('Suppressed result exposes essay details');
    const seen=new Set();
    for(const e of p.essays){if(!Number.isInteger(e.exercise)||seen.has(e.exercise)||typeof e.original!=='string'||!Array.isArray(e.corrections)||!Array.isArray(e.upgraded_paragraphs)||!Array.isArray(e.collocations))throw Error('Invalid essay');seen.add(e.exercise);}
    return p;
  }
  function sectionLabel(value){
    const text=String(value||'').trim().toLowerCase();
    const names={introduction:'Introduction',intro:'Introduction',overview:'Overview',conclusion:'Conclusion',body:'Body'};
    if(names[text])return names[text];
    const body=text.match(/^(?:detail|body)(?:\s+paragraph)?\s*(\d+)$/);
    if(body)return (/^detail/.test(text)?'Detail ':'Body ')+Number(body[1]);
    // Unit labels are model-internal segments, not dependable lesson/paragraph numbers.
    return '';
  }
  function correctionLocation(p,e,c){
    const source=e.original, paragraphs=[];
    const separator=/\r?\n\s*\r?\n/.test(source)?/\r?\n\s*\r?\n/g:/\r?\n/g;
    let start=0;
    for(const match of source.matchAll(separator)){
      if(source.slice(start,match.index).trim())paragraphs.push({start,end:match.index,text:source.slice(start,match.index)});
      start=match.index+match[0].length;
    }
    if(source.slice(start).trim())paragraphs.push({start,end:source.length,text:source.slice(start)});
    const task=typeof ieltsWritingAssignments_!=='undefined' && ieltsWritingAssignments_.all?.().find(a=>a.assignmentCode===p.task_code)?.tasks.find(t=>t.taskNumber===e.exercise);
    const task1=Boolean(task && /\bTask\s*1\b/i.test(task.title));
    const overview=paragraphs.map((r,i)=>/^\s*(?:overall\b|in summary\b|to summarise\b|to summarize\b)/i.test(r.text)?i:-1).filter(i=>i>=0);
    const structured=task1 && paragraphs.length>=3 && overview.length===1 && overview[0]>0 && /^\s*(?:the|this)\b[\s\S]{0,80}\b(?:table|chart|graph|diagram|map|maps|charts|graphs)\b/i.test(paragraphs[0].text);
    const body=structured?paragraphs.map((r,i)=>i).filter(i=>i!==0&&i!==overview[0]):[];
    const name=i=>!structured?'Đoạn '+(i+1):i===0?'Introduction':i===overview[0]?'Overview':body.length===1?'Detail':'Detail '+(body.indexOf(i)+1);
    const locations=[];
    if(!c.original)return sectionLabel(c.section);
    let at=source.indexOf(c.original);
    while(at>=0){
      paragraphs.forEach((r,i)=>{
        if(at>=r.end || at+c.original.length<=r.start)return;
        // Use real sentence boundaries, not model audit Unit numbers.
        const segments=typeof Intl.Segmenter==='function'?[...new Intl.Segmenter('en',{granularity:'sentence'}).segment(r.text)].filter(s=>s.segment.trim()):[];
        const hit=segments.map((s,n)=>at<r.start+s.index+s.segment.length&&at+c.original.length>r.start+s.index?n+1:0).filter(Boolean);
        const suffix=hit.length?' · Câu '+(hit.length===1?hit[0]:hit[0]+'–'+hit[hit.length-1]):'';
        locations.push(name(i)+suffix);
      });
      at=source.indexOf(c.original,at+c.original.length);
    }
    return [...new Set(locations)].join('; ') || sectionLabel(c.section);
  }
  function reviewRecord(p,e){
    const paragraphs=e.upgraded_paragraphs.map(p=>p.map(s=>s.text).join(''));
    const annotations=e.corrections.map((c,i)=>{
      const anchors=[];let at=e.original.indexOf(c.original);
      while(c.original && at>=0){anchors.push({start:at,end:at+c.original.length,quote:c.original});at=e.original.indexOf(c.original,at+c.original.length);}
      return {id:'C'+String(i+1).padStart(2,'0'),label:'Lỗi '+(i+1),title:correctionLocation(p,e,c),
        bodyMarkdown:c.error+'\n\n**Cách sửa:** '+c.suggested,anchors};
    });
    return {schemaVersion:1,savedModelResult:true,resultId:'saved-'+p.task_code+'-'+p.student_id+'-'+e.exercise+'-'+p.graded_at,
      className:p.class_name,studentName:p.student_name,assignmentCode:p.task_code,taskNumber:e.exercise,
      originalEssay:e.original,originalWordCount:e.word_count,overall:e.summary_vi,learningVerdict:e.status,
      submittedAt:p.received_at,publication:{state:'published',publishedAt:p.graded_at},annotations,
      suggestedRevision:paragraphs.join('\n\n'),suggestedRevisionParagraphs:paragraphs,
      suggestedRevisionWordCount:paragraphs.join(' ').trim().split(/\s+/).length,
      dataGrouping:e.taught_application_vi,appliedKnowledge:[e.taught_application_vi],collocations:e.collocations};
  }
  function essayHtml(e,p){
    if(typeof ieltsWritingReviews_!=='undefined' && ieltsWritingReviews_.savedResultCard){
      return '<div data-hybrid-essay="'+e.exercise+'">'+ieltsWritingReviews_.savedResultCard(reviewRecord(p,e))+'</div>';
    }
    return '<details class="hy-essay" data-hybrid-essay="'+e.exercise+'"><summary>Đề '+e.exercise+' · '+esc(e.status)+' · Xem bài chữa</summary><div class="hy-essay-body">'+
      '<h4>Nhận xét bài viết</h4>'+prose(e.summary_vi)+prose(e.taught_application_vi)+
      '<h4>Bài em đã nộp · '+esc(e.word_count)+' từ</h4>'+prose(e.original)+
        '<h4>Chữa từng lỗi</h4>'+e.corrections.map((c,i)=>'<blockquote><strong>Lỗi '+(i+1)+(correctionLocation(p,e,c)?' · '+correctionLocation(p,e,c):'')+'</strong>'+prose(c.original)+prose(c.error)+prose('Sửa: '+c.suggested)+'</blockquote>').join('')+
      '<h4>Bài viết tham khảo sau khi sửa</h4>'+e.upgraded_paragraphs.map(p=>'<p class="hy-prose">'+p.map(s=>'<span class="hy-'+(['yellow','blue','green'].includes(s.color)?s.color:'plain')+'">'+esc(s.text)+'</span>').join('')+'</p>').join('')+
      (e.collocations.length?'<h4>Cụm từ cần ghi nhớ</h4>'+e.collocations.map(c=>prose(c.phrase+' ('+c.type+'): '+c.meaning_vi+'\n'+c.usage_example)).join(''):'')+'</div></details>';
  }
  function resultHtml(p){
    const header='<header class="hy-head"><h3>Nhận xét bài tập về nhà</h3><p>Buổi '+esc(p.lesson)+(p.state==='graded'?' · Đã trả '+p.essays.length+' bài chữa':'')+'</p></header>';
    const links=(p.notebook_links||[]).filter(u=>/^https:\/\/drive\.google\.com\/file\/d\/[A-Za-z0-9_-]+\/view$/.test(u)).map((u,i)=>'<a class="wr-button secondary" href="'+esc(u)+'" target="_blank" rel="noopener noreferrer">Mở vở đã nộp'+(i?' '+(i+1):'')+'</a>').join(' ');
    if(p.state!=='graded')return header+'<div class="hy-content" role="status">'+prose(p.warning)+prose(p.received_display?'Thời gian nhận: '+p.received_display:'')+links+'</div>';
    return header+'<div class="hy-content"><section class="hy-notebook"><strong>VỞ ĐÃ ĐẠT YÊU CẦU</strong><details><summary>Xem nhận xét và vở đã nộp</summary>'+prose(p.warning)+links+'</details></section>'+p.essays.map(e=>essayHtml(e,p)).join('')+'</div>';
  }
  function mount(key){
    const entry=cache.get(key);if(!entry||entry.identity!==identity())return;
    document.querySelectorAll('[data-hybrid-result]').forEach(node=>{
      if(node.dataset.hybridResult!==key)return;
      const version=entry.payload?'ready':entry.error?'error':'loading';
      if(node.dataset.hybridState===version && (!entry.payload || node.dataset.hybridPayload===JSON.stringify(entry.payload)))return;
      const expanded=[...node.querySelectorAll('details')].map((n,i)=>n.open?i:-1);
      node.dataset.hybridState=version;
      node.innerHTML=entry.payload?resultHtml(entry.payload):'<p role="status">'+(entry.error?'Chưa tải được bài chữa. Em có thể mở đường dẫn bên dưới hoặc tải lại trang.':'Đang mở bài chữa của em…')+'</p>';
      if(entry.payload)node.dataset.hybridPayload=JSON.stringify(entry.payload);
      node.querySelectorAll('details').forEach((n,i)=>{if(expanded.includes(i))n.open=true;});
      if(entry.error){const a=document.createElement('a');a.textContent='Mở bài chữa chi tiết';a.href=entry.ref.url;a.target='_blank';a.rel='noopener noreferrer';node.append(a);}
    });
  }
  function load(ref){
    const key=ref.profile+'|'+ref.code,id=identity();
    let entry=cache.get(key);
    if(entry&&entry.identity===id&&Date.now()-entry.created<180000){setTimeout(()=>mount(key),0);return key;}
    const previous=entry?.identity===id?entry.payload:null;
    const started=epoch;entry={identity:id,ref,created:Date.now(),payload:previous};cache.set(key,entry);
    (async()=>{
      const response=await fetch(ORIGIN+'/ielts-writing-grader/dashboard_data/'+ref.profile+'.json',{cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer'});
      if(!response.ok)throw Error('Unavailable');const envelope=await response.json();
      const k=await crypto.subtle.importKey('raw',b64(ref.secret),'AES-GCM',false,['decrypt']);
      const bytes=await crypto.subtle.decrypt({name:'AES-GCM',iv:b64(envelope.nonce),additionalData:new TextEncoder().encode(ref.profile)},k,b64(envelope.ciphertext));
      if(started!==epoch||identity()!==id)return;
      entry.payload=validate(JSON.parse(new TextDecoder().decode(bytes)),ref);
    })().catch(()=>{entry.error=true;}).finally(()=>{if(started===epoch&&identity()===id)mount(key);});
    return key;
  }
  function fragment(item,legacyHtml,blocked=false){
    if(item?.skill!=='writing'||!identity()||blocked)return null;
    const template=document.createElement('template');template.innerHTML=legacyHtml||'';
    const text=template.content.textContent;
    if(!text.includes('【KẾT QUẢ CHẤM ')||!text.includes('【HẾT KẾT QUẢ CHẤM】'))return null;
    const ref=pointer(text);if(!ref)return null;
    const assignment=ieltsWritingAssignments_.forItem(item);
    if(!assignment||assignment.assignmentCode!==ref.code)return null;
    template.content.querySelectorAll('.ielts-feedback-message').forEach(node=>{
      const outside=node.textContent.replace(/【KẾT QUẢ CHẤM [\s\S]*?【HẾT KẾT QUẢ CHẤM】/g,'').trim();
      if(outside)node.textContent=outside;else node.remove();
    });
    template.content.querySelectorAll('p > strong').forEach(node=>{if(node.textContent.trim().replace(/:$/,'')==='Nhận xét bài tập về nhà')node.textContent='Tình trạng nộp bài:';});
    const key=load(ref);
    const saved=cache.get(key),ready=saved&&saved.identity===identity()&&saved.payload;
    const existing=[...document.querySelectorAll('[data-hybrid-result]')].find(n=>n.dataset.hybridResult===key && n.dataset.hybridState==='ready');
    const result=document.createElement('template');result.innerHTML=ready?resultHtml(saved.payload):'<p role="status">Đang mở bài chữa của em…</p>';
    if(existing&&ready){const opened=[...existing.querySelectorAll('details')].map((n,i)=>n.open?i:-1);result.content.querySelectorAll('details').forEach((n,i)=>{if(opened.includes(i))n.open=true;});}
    return template.innerHTML+'<section class="hy-result" data-hybrid-result="'+esc(key)+'"'+(ready?' data-hybrid-state="ready" data-hybrid-payload="'+esc(JSON.stringify(saved.payload))+'"':'')+' aria-label="Nhận xét bài tập về nhà">'+result.innerHTML+'</section>';
  }
  window.addEventListener('hashchange',clear);window.addEventListener('pagehide',clear);
  return {fragment,clear,reviewRecord,sectionLabel,correctionLocation};
})();
/* IELTS_WRITING_FEEDBACK_V1: personal results only, with live bearer authorization. IELTS_WRITING_HOMEWORK_WARM_V2 */
const ieltsWritingReviews_ = (() => {
  'use strict';
  const REFRESH_INTERVAL_MS = 180000;
  let identity = '', generation = 0, status = 'idle', reviews = [], sourceStates = [], notebookStates = [], writingPolicyStates = [], inFlight = null, lastFetch = 0, hasLoaded = false, refreshing = false;
  let dialog = null, opener = null, scrollBefore = '', selectedReview = null;
  const revisionCache = new Map();
  const savedReviews = new Map();
  let reviewWarmObserver = null, reviewWarmTimer = 0;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  const normalizedName = value => String(value || '').normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleUpperCase('vi');
  const array = value => Array.isArray(value) ? value : [];
  function inline(value) {
    // User/model text is escaped first. Only local emphasis is rendered; no HTML or links.
    return escape(value).replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>').replace(/`([^`\n]+)`/g, '<code>$1</code>');
  }
  function prose(value) { return String(value || '').split(/\n\s*\n/).map(p => '<p>' + inline(p).replace(/\n/g, '<br>') + '</p>').join(''); }
  function who() {
    return ieltsWritingAssignments_.all().length && parentState.authorized && !parentState.locked && parentState.name
      ? [ieltsParentAccess.className, parentState.revision, parentState.name].join('|') : '';
  }
  function close() {
    if (dialog && dialog.open) dialog.close();
    document.body.style.overflow = scrollBefore;
    if (opener && opener.isConnected) opener.focus({preventScroll:true});
    selectedReview = null;
  }
  function clear() {
    ieltsHybridReviews_.clear();
    generation++; identity = ''; reviews = []; sourceStates = []; notebookStates = []; writingPolicyStates = []; status = 'idle'; inFlight = null; lastFetch = 0; hasLoaded = false; refreshing = false;
    revisionCache.clear(); savedReviews.clear();
    clearTimeout(reviewWarmTimer); reviewWarmTimer = 0;
    reviewWarmObserver?.disconnect(); reviewWarmObserver = null;
    if (dialog) { close(); dialog.remove(); dialog = null; }
  }
  function current() {
    const next = who();
    if (next !== identity) { clear(); identity = next; }
    return Boolean(next);
  }
  const code = ieltsWritingAssignments_.code;
  function validRecord(record) {
    if (record && record.taskType === 2 && (!record.task2 || array(record.task2.criteria).length !== 5 || !Array.isArray(record.task2.outlineCoverage))) return false;
    return Boolean(record && record.schemaVersion === 1 && record.resultId &&
      record.className === ieltsParentAccess.className && normalizedName(record.studentName) === normalizedName(parentState.name) &&
      code(record.assignmentCode) && Number.isInteger(Number(record.taskNumber)) && Number(record.taskNumber) > 0 && Number(record.taskNumber) <= 50 &&
      typeof record.overall === 'string' && typeof record.originalEssay === 'string' && record.originalEssay && record.suggestedRevision &&
      record.publication && ['published','returned'].includes(record.publication.state));
  }
  function repaint() {
    if (!current() || !state.student || !state.dashboard || normalizedName(state.student.name) !== normalizedName(parentState.name)) return;
    // Remove details from already-rendered inactive panels as soon as a closure arrives.
    document.querySelectorAll('.wr-assignment[data-wr-assignment]').forEach(node => {
      const assignment = ieltsWritingAssignments_.all().find(item => item.assignmentCode === node.dataset.wrAssignment);
      if (assignment && writingBlockedByPolicy(assignment.assignmentCode)) node.outerHTML = groupHtml(assignment);
    });
    if (state.active === 'writing') renderSkill('writing');
    if (state.active === 'overview') renderOverview();
  }
  function sourceState(assignmentCode, taskNumber) {
    return sourceStates.find(item => code(item.assignmentCode) === code(assignmentCode) && Number(item.taskNumber) === Number(taskNumber)) || {state:'source_unavailable'};
  }
  function isCurrentReview(record) {
    if(record && savedReviews.get(record.resultId)===record) return !writingBlockedByPolicy(record.assignmentCode);
    return Boolean(record && !writingBlockedByPolicy(record.assignmentCode) && sourceState(record.assignmentCode, record.taskNumber).state === 'current' &&
      sourceState(record.assignmentCode, record.taskNumber).currentResultId === record.resultId);
  }
  function readSourceStates(data) {
    const allowed = ['current','pending','empty_submission','ambiguous_source','source_error','source_unavailable','not_submitted'];
    const entries = array(data.sourceStates), seen = new Set();
    const valid = entries.every(item => {
      if (!item || !code(item.assignmentCode) || !Number.isInteger(item.taskNumber) || item.taskNumber < 1 || item.taskNumber > 50 || !allowed.includes(item.state)) return false;
      const group = code(item.assignmentCode) + '|' + item.taskNumber;
      if (seen.has(group)) return false; seen.add(group);
      return item.state !== 'current' || typeof item.currentResultId === 'string' && data.reviews.some(record =>
        record.resultId === item.currentResultId && code(record.assignmentCode) === code(item.assignmentCode) && Number(record.taskNumber) === item.taskNumber);
    });
    // Missing or invalid freshness evidence must not promote a historical review.
    return valid ? entries : [];
  }
  function readNotebookStates(data) {
    if (data.notebookStates === undefined) return [];
    if (!Array.isArray(data.notebookStates)) throw new Error('Notebook response mismatch');
    const seen = new Set();
    for (const item of data.notebookStates) {
      if (!item || item.className !== ieltsParentAccess.className || normalizedName(item.studentName) !== normalizedName(parentState.name) ||
          !code(item.assignmentCode) || seen.has(code(item.assignmentCode)) || typeof item.state !== 'string' ||
          typeof item.current !== 'boolean' || typeof item.historical !== 'boolean' ||
          (item.essayGradingLocked !== undefined && typeof item.essayGradingLocked !== 'boolean') ||
          !['notebook_only','notebook_and_writing'].includes(item.homeworkMode)) throw new Error('Notebook identity mismatch');
      seen.add(code(item.assignmentCode));
    }
    return data.notebookStates;
  }
  function writingPolicy(assignmentCode) {
    return writingPolicyStates.find(item => code(item.assignmentCode) === code(assignmentCode));
  }
  function writingBlockedByPolicy(assignmentCode) {
    return ['too_late','policy_unavailable'].includes(writingPolicy(assignmentCode)?.state);
  }
  function readWritingPolicyStates(data) {
    // Older responses may omit this field. They cannot clear an already-known closure.
    if (data.writingPolicyStates === undefined) return writingPolicyStates;
    const unavailable = assignmentCode => ({assignmentCode,state:'policy_unavailable',closed:true});
    const allUnavailable = () => ieltsWritingAssignments_.all().map(item => unavailable(item.assignmentCode));
    if (!Array.isArray(data.writingPolicyStates)) return allUnavailable();
    const entries = new Map();
    for (const item of data.writingPolicyStates) {
      const assignmentCode = code(item && item.assignmentCode);
      if (!assignmentCode) return allUnavailable();
      const cutoffValid = typeof item.cutoffAt === 'string' && /^\d{4}-\d{2}-\d{2}T00:00:00(?:\.000)?\+07:00$/.test(item.cutoffAt) && Number.isFinite(Date.parse(item.cutoffAt));
      const valid = item.closed === true && ['grading_closed','too_late','policy_unavailable'].includes(item.state) &&
        (item.state === 'policy_unavailable' || cutoffValid);
      entries.set(assignmentCode, entries.has(assignmentCode) || !valid ? unavailable(assignmentCode) : {...item,assignmentCode});
    }
    return [...entries.values()];
  }
  async function refresh(force = false) {
    if (!current() || document.visibilityState === 'hidden') return;
    if (inFlight) return inFlight;
    if (!force && lastFetch && Date.now() - lastFetch < (hasLoaded ? REFRESH_INTERVAL_MS : 30000)) return;
    const epoch = generation, startedFor = identity;
    lastFetch = Date.now(); refreshing = true;
    if (!hasLoaded) status = 'loading';
    // A background read is not a change to a saved review. Keep the DOM and
    // last authenticated snapshot until a response supplies new evidence.
    const before = JSON.stringify([status,reviews,sourceStates,notebookStates,writingPolicyStates]);
    const request = ieltsParentAccess.request('writing', force).then(data => {
      if (epoch !== generation || who() !== startedFor) return;
      if (!data || data.className !== ieltsParentAccess.className || data.parentName !== parentState.name ||
          data.parentRosterRevision !== parentState.revision || normalizedName(data.studentName) !== normalizedName(parentState.name) ||
          !Array.isArray(data.reviews)) throw new Error('Writing identity mismatch');
      // Apply an authenticated closure even if the accompanying feedback is malformed.
      writingPolicyStates = readWritingPolicyStates(data); updateOpenFreshness();
      // Reject a mixed payload as a whole, including malformed/unpublished entries.
      if (data.reviews.some(record => !validRecord(record))) throw new Error('Writing result mismatch');
      const checkedNotebooks = readNotebookStates(data);
      reviews = data.reviews.slice().sort((a,b) => String(b.publication.publishedAt || '').localeCompare(String(a.publication.publishedAt || '')));
      notebookStates = checkedNotebooks;
      sourceStates = readSourceStates(data);
      status = 'ready'; hasLoaded = true; refreshing = false; updateOpenFreshness();
    }).catch(() => {
      if (epoch === generation && who() === startedFor) {
        sourceStates = []; notebookStates = notebookStates.map(item => item.publicationFinal ? item : ({...item,current:false,historical:Boolean(item.overall),receiptStatus:undefined})); refreshing = false;
        // A transient read failure cannot certify an old review as current.
        // Its already-authorized historical content remains available in place.
        if (hasLoaded) { status = 'ready'; updateOpenFreshness(); }
        else { reviews = []; status = 'error'; }
      }
    })
      .finally(() => { if (epoch === generation && who() === startedFor) {
        inFlight = null;
        if (before !== JSON.stringify([status,reviews,sourceStates,notebookStates,writingPolicyStates])) repaint();
      } });
    inFlight = request; return request;
  }
  function updateOpenFreshness() {
    if (dialog && writingBlockedByPolicy(dialog.dataset.wrAssignment)) {
      close(); dialog.remove(); dialog = null; return;
    }
    if (!dialog || !dialog.open || !selectedReview) return;
    dialog.querySelector('[data-wr-review-label]').textContent = isCurrentReview(selectedReview) ? 'Đã trả bài' : 'Bài chữa lần nộp trước';
    dialog.querySelector('[data-wr-freshness]').innerHTML = freshnessHtml(selectedReview.assignmentCode, selectedReview.taskNumber, selectedReview);
  }
  function overallHtml(record) { return '<div class="wr-copy wr-overall">' + prose(record.overall) + '</div>'; }
  function submissionDate(value) {
    const text = String(value || '');
    if (!/^\d{4}-\d{2}-\d{2}T/.test(text)) return text;
    const date = new Date(text); if (!Number.isFinite(date.getTime())) return text;
    return new Intl.DateTimeFormat('vi-VN', {day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',hourCycle:'h23',timeZone:'Asia/Bangkok'}).format(date).replace(', ', ' · ');
  }
  function freshnessHtml(assignmentCode, taskNumber, record) {
    if (isCurrentReview(record)) return '';
    const latest = sourceState(assignmentCode, taskNumber);
    // A temporary source-read failure does not invalidate an already returned review.
    if (record && latest.state === 'source_unavailable') return '';
    const messages = {
      current:'Đã có bài chữa cho lần nộp mới nhất. Em đang xem bài chữa được mở trước đó.',
      pending:'Lần nộp mới nhất của Đề ' + taskNumber + ' chưa có bài chữa theo tiêu chí hiện hành.',
      empty_submission:'Lần gửi mới nhất để trống Đề ' + taskNumber + '. Chưa có bài viết mới để chấm.',
      ambiguous_source:'Có các bài Đề ' + taskNumber + ' khác nội dung cùng thời điểm nộp. Cô sẽ kiểm tra bài trước khi chấm.',
      source_error:'Thông tin tên hoặc thời điểm nộp Đề ' + taskNumber + ' cần được đối chiếu trước khi chấm.',
      not_submitted:'Chưa tìm thấy bài nộp Đề ' + taskNumber + ' trong nguồn chấm hiện tại.',
      source_unavailable:refreshing ? 'Đang kiểm tra lần nộp mới nhất của Đề ' + taskNumber + '…' : 'Chưa xác minh được lần nộp mới nhất của Đề ' + taskNumber + '.'
    };
    const message = messages[latest.state] || messages.source_unavailable;
    return '<p class="wr-status" role="status">' + escape(message) + (latest.submittedAt ? ' <span>Lần gửi: ' + escape(submissionDate(latest.submittedAt)) + '.</span>' : '') +
      (record ? ' Bài chữa bên dưới được lưu từ lần chấm trước.' : '') + '</p>';
  }
  function card(record, assignment, task) {
    const label = assignment.weekCode + ' · ' + (task.displayLabel || 'Đề ' + task.taskNumber);
    const head = '<h5>' + escape(label) + '</h5>' + (task.title ? '<p class="wr-task-title">' + escape(task.title) + '</p>' : '');
    if (!record) return '<article class="wr-summary wr-pending" data-wr-task="' + task.taskNumber + '">' + head +
      freshnessHtml(assignment.assignmentCode, task.taskNumber, null) + '</article>';
    return '<article class="wr-summary" data-wr-task="' + task.taskNumber + '"><span class="wr-kicker">' + (isCurrentReview(record) ? 'Bài chữa của Cô · Đã trả' : 'Bài chữa lần nộp trước') + '</span>' + head +
      freshnessHtml(assignment.assignmentCode, task.taskNumber, record) +
      '<span class="wr-verdict">' + escape(record.learningVerdict) + '</span>' + (record.submissionStatus === 'wrong_task' ? '<p class="wr-wrong-task">Bài nộp chưa đúng đề</p>' : '') + overallHtml(record) +
      '<p class="wr-submitted">Bài em nộp: ' + escape(submissionDate(record.submittedAt || record.source && record.source.submittedAt)) + ' · ' + escape(record.originalWordCount) + ' từ</p>' +
      '<button class="wr-button" type="button" data-wr-open="' + escape(record.resultId) + '" aria-label="Xem bài chữa ' + escape(label) + '">Xem bài chữa</button></article>';
  }
  function loadStatus() {
    if (status === 'error') return '<div class="wr-status" role="status">Chưa tải được bài chữa.<button class="wr-button secondary" type="button" data-wr-retry>Thử lại</button></div>';
    return '<p class="wr-status" role="status">Đang tải bài chữa của em…</p>';
  }
  function assignmentHtml(item) {
    if (!current()) return '';
    const assignment = ieltsWritingAssignments_.forItem(item); if (!assignment) return '';
    return groupHtml(assignment);
  }
  function hasAssignmentResults(assignment) {
    return reviews.some(record => code(record.assignmentCode) === assignment.assignmentCode) ||
      notebookStates.some(record => code(record.assignmentCode) === assignment.assignmentCode) || Boolean(writingPolicy(assignment.assignmentCode));
  }
  function submissionSummary(assignment) {
    if (!current() || status !== 'ready' || refreshing || !assignment.tasks.length || writingBlockedByPolicy(assignment.assignmentCode)) return '';
    const latest = assignment.tasks.map(task => ({...sourceState(assignment.assignmentCode, task.taskNumber),taskNumber:task.taskNumber}));
    if (!latest.every(item => ['current','pending','empty_submission','not_submitted'].includes(item.state))) return '';
    const submitted = latest.filter(item => ['current','pending'].includes(item.state));
    const missing = latest.filter(item => !['current','pending'].includes(item.state));
    let summary = submitted.length ? 'Đã nộp ' + submitted.length + '/' + latest.length + ' bài viết' : 'Chưa nộp bài viết';
    if (submitted.length && missing.length) summary += ' · Chưa nộp: ' + missing.map(item => 'Đề ' + item.taskNumber + (item.state === 'empty_submission' ? ' (để trống)' : '')).join(', ');
    else if (!submitted.length && missing.some(item => item.state === 'empty_submission')) summary += ' · Để trống: ' + missing.filter(item => item.state === 'empty_submission').map(item => 'Đề ' + item.taskNumber).join(', ');
    const times = submitted.map(item => Date.parse(item.submittedAt)).filter(Number.isFinite);
    if (times.length) summary += ' · ' + submissionDate(new Date(Math.max(...times)).toISOString());
    return summary;
  }
  function homeworkStatusHtml(item, legacyHtml) {
    // Establish the identity before the hybrid fragment starts loading. A later
    // first refresh must not clear the just-created private result cache.
    if (!current()) return legacyHtml;
    const assignment = ieltsWritingAssignments_.forItem(item);
    const hybrid = assignment?.preferredReviewDelivery === "native" ? null : ieltsHybridReviews_.fragment(item,legacyHtml,assignment && (writingBlockedByPolicy(assignment.assignmentCode) || writingBlockedByNotebook(assignment)));
    if (hybrid !== null) return hybrid;
    if (!assignment) return legacyHtml;
    if (assignment.reviewDriven && !hasLoaded && status !== 'error') {
      const waiting = document.createElement('template'); waiting.innerHTML = legacyHtml || '';
      waiting.content.querySelectorAll('.ielts-feedback-message,.ielts-feedback-empty').forEach(node => node.remove());
      return waiting.innerHTML + '<section class="wr-assignment" aria-busy="true">' + loadStatus() + '</section>';
    }
    const summary = submissionSummary(assignment);
    const feedbackActive = !assignment.reviewDriven || hasAssignmentResults(assignment);
    if (!feedbackActive && !summary) return legacyHtml;
    // Replace feedback prose in this display fragment only. Submission badges,
    // attempts, timestamps, missing/late alerts and source links stay intact.
    const retained = document.createElement('template');
    retained.innerHTML = legacyHtml || '';
    if (feedbackActive) {
      retained.content.querySelectorAll('.ielts-feedback-message,.ielts-feedback-empty').forEach(node => node.remove());
      retained.content.querySelectorAll('p > strong').forEach(node => {
        if (node.textContent.trim().replace(/:$/, '') === 'Nhận xét bài tập về nhà') node.textContent = 'Tình trạng nộp bài:';
      });
    }
    // A complete fresh read can replace the legacy source warning without
    // changing deadline, missing/late badges, attempts or receipt metadata.
    if (summary) retained.content.querySelectorAll('p.direct-source-status').forEach(node => {
      const receipt = document.createElement('p');
      receipt.className = 'wr-submitted wr-receipt-summary'; receipt.textContent = summary;
      node.replaceWith(receipt);
    });
    return retained.innerHTML + (feedbackActive ? assignmentHtml(item) : '');
  }
  function groupHtml(assignment) {
    if (assignment.reviewDriven && !hasAssignmentResults(assignment)) return '';
    const policy = writingPolicy(assignment.assignmentCode), policyBlocked = writingBlockedByPolicy(assignment.assignmentCode);
    const results = assignment.tasks.map(task => reviews.find(record => code(record.assignmentCode) === assignment.assignmentCode && Number(record.taskNumber) === task.taskNumber));
    const count = results.filter(isCurrentReview).length;
    const essayBlocked = writingBlockedByNotebook(assignment);
    const finalNotebookFailure = notebookStates.some(item => code(item.assignmentCode) === assignment.assignmentCode && item.essayGradingLocked === true);
    const subtitle = policyBlocked ? '' : essayBlocked ? (finalNotebookFailure ? ' · Vở chưa đạt yêu cầu' : ' · Chờ xác minh vở') :
      assignment.tasks.length && status === 'ready' ? ' · Đã trả ' + count + '/' + assignment.tasks.length + ' bài chữa' + (policy?.state === 'grading_closed' ? '' : ' cho lần nộp mới nhất') : '';
    const title = policyBlocked ? 'Tình trạng nộp bài' : 'Nhận xét bài tập về nhà';
    return '<section class="wr-assignment" data-wr-assignment="' + escape(assignment.assignmentCode) + '" aria-label="' + title + ' · Writing ' + escape(assignment.weekCode) + '">' +
      '<header class="wr-feedback-head"><h4>' + title + '</h4><p>Writing ' + escape(assignment.weekCode) + subtitle + '</p></header>' +
      (policyBlocked ? writingPolicyHtml(policy) : status === 'ready' ? notebookHtml(assignment) + (assignment.tasks.length && !essayBlocked ? '<div class="wr-exercises">' + assignment.tasks.map((task,index) => card(results[index], assignment, task)).join('') + '</div>' : '') : loadStatus()) + '</section>';
  }
  function writingPolicyHtml(item) {
    if (item.state === 'policy_unavailable') return '<section class="wr-policy wr-policy-unavailable" role="status"><p>Hiện chưa thể hiển thị bài chữa. Vui lòng thử lại sau.</p></section>';
    const urls = [...new Set(array(item.files).map(file => ieltsWritingAssignments_.safeUrl(file && file.url)).filter(Boolean))];
    const links = urls.map((url,index) => '<a class="wr-button secondary" href="' + escape(url) + '" target="_blank" rel="noopener noreferrer">Mở vở đã nộp' + (urls.length > 1 ? ' ' + (index + 1) : '') + '</a>').join('');
    const received = typeof item.submittedAt === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(item.submittedAt) && Number.isFinite(Date.parse(item.submittedAt))
      ? '<p class="wr-submitted">Đã nhận bài: <time datetime="' + escape(item.submittedAt) + '">' + escape(submissionDate(item.submittedAt)) + '</time></p>' : '';
    return '<section class="wr-policy wr-policy-too-late" role="alert"><h5>NỘP QUÁ MUỘN — KHÔNG ĐƯỢC CHẤM CHỮA CHI TIẾT</h5>' + received + (links ? '<div class="wr-policy-files">' + links + '</div>' : '') + '</section>';
  }
  function writingBlockedByNotebook(assignment) {
    const item = notebookStates.find(entry => code(entry.assignmentCode) === assignment.assignmentCode);
    return Boolean(item && item.homeworkMode === 'notebook_and_writing' &&
      (item.essayGradingLocked === true || (!refreshing && item.current && !['notebook_complete', 'teacher_grading_exception'].includes(item.state))));
  }
  function notebookHtml(assignment) {
    const item = notebookStates.find(entry => code(entry.assignmentCode) === assignment.assignmentCode);
    if (!item) return assignment.notebook ? '<section class="wr-notebook wr-notebook-pending"><h5>Vở chép · Nhận xét của Cô</h5><p>Chưa có kết quả kiểm tra vở.' + (assignment.tasks.length ? ' Bài viết mới chỉ được chấm sau khi vở đạt yêu cầu.' : ' Kết quả sẽ hiện sau khi vở được đối chiếu với tài liệu Cô giao.') + '</p></section>' : '';
    const hasWriting = item.homeworkMode === 'notebook_and_writing';
    const current = item.current;
    const notebookFinal = !hasWriting && item.state === 'notebook_verdict_final' && Boolean(item.overall);
    const teacherException = current && item.state === 'teacher_grading_exception' && item.essayGradingLocked === false;
    const failed = notebookFinal || teacherException || current && item.state === 'awaiting_notebook_completion' && (array(item.issues).length || item.overall);
    const complete = current && item.state === 'notebook_complete';
    const finalLock = item.essayGradingLocked === true;
    const writingBlocked = hasWriting && (finalLock || (current && failed && !teacherException));
    const blockedNotebookUrls = array(item.notebookUrls).map(value => ieltsWritingAssignments_.safeUrl(typeof value === 'string' ? value : value && value.url)).filter(Boolean);
    const blockedNotebookLinks = blockedNotebookUrls.map((url, index) => '<a class="wr-button secondary" href="' + escape(url) + '" target="_blank" rel="noopener noreferrer">Mở vở đã nộp' + (blockedNotebookUrls.length > 1 ? ' ' + (index + 1) : '') + '</a>').join('');
    const blockedHtml = () => '<section class="wr-notebook wr-notebook-quick wr-notebook-blocked" aria-label="Kiểm tra vở" role="alert"><span class="wr-kicker">Vở chép · Nhận xét của Cô</span><h5>KHÔNG ĐƯỢC CHẤM BÀI VIẾT</h5><div class="wr-notebook-alert"><strong>Vở chưa đạt yêu cầu nên bài viết không được chấm chữa chi tiết.</strong></div><div class="wr-notebook-reason"><strong>Lý do vở chưa đạt:</strong>' + prose(item.overall || item.reason || 'Vở chưa đáp ứng yêu cầu của bài được giao.') + '</div>' +
      (item.submittedAt ? '<p class="wr-submitted">Đã nhận vở: ' + escape(submissionDate(item.submittedAt)) + '</p>' : '') + blockedNotebookLinks + '</section>';
    // Receipt evidence is separate from a current check. Access failures and
    // refreshes must never turn an unknown receipt into a missing notebook.
    const receiptTitle = item.receiptStatus === 'submitted' ? 'Đã nộp vở' : item.receiptStatus === 'not_submitted' ? 'Chưa nộp vở' : '';
    const title = !current ? (receiptTitle || (item.historical ? 'Nhận xét vở lần kiểm tra trước' : 'Chờ xác minh vở hiện tại')) :
      failed ? (teacherException || item.homeworkMode === 'notebook_only' ? 'VỞ CHƯA ĐẠT YÊU CẦU' : 'KHÔNG ĐƯỢC CHẤM BÀI') :
      complete ? 'VỞ ĐÃ ĐẠT YÊU CẦU' : item.displayTitle || 'Chờ kiểm tra vở';
    const latestNote = !notebookFinal && !current && (!receiptTitle || item.overall) ? '<p class="wr-notebook-freshness">' + (refreshing ? 'Đang đối chiếu lần nộp mới nhất…' : 'Kết quả bên dưới chưa xác nhận tình trạng vở hiện tại.' + (hasWriting ? ' Bài viết mới tiếp tục chờ kiểm tra vở.' : ' Bố mẹ xem hướng dẫn bài vở Cô đã giao.')) + '</p>' +
      (!refreshing && item.overall && item.reason ? '<p class="wr-notebook-current-reason"><strong>Lần nộp hiện tại: </strong>' + escape(item.reason) + '</p>' : '') : '';
    if (item.reviewMode === 'quick_check' || complete) {
      const notebookLinks = array(item.notebookUrls).map((value, index) => {
        const url = ieltsWritingAssignments_.safeUrl(typeof value === 'string' ? value : value && value.url);
        return url ? '<a class="wr-button secondary" href="' + escape(url) + '" target="_blank" rel="noopener noreferrer">Mở vở đã nộp' + (item.notebookUrls.length > 1 ? ' ' + (index + 1) : '') + '</a>' : '';
      }).join('');
      const latestSubmission = item.historical && item.submittedAt && item.submittedAt !== item.reviewSubmittedAt
        ? '<p class="wr-submitted">Lần nộp mới nhất: ' + escape(submissionDate(item.submittedAt)) + '</p>' : '';
      const quickTitle = notebookFinal || teacherException || (failed && item.homeworkMode === 'notebook_only') ? 'VỞ CHƯA ĐẠT YÊU CẦU' : complete ? 'VỞ ĐÃ ĐẠT YÊU CẦU' : receiptTitle || (!current ? title : failed ? 'Vở đã nộp' : item.displayTitle || 'Kiểm tra vở');
      if (writingBlocked) return blockedHtml();
      return '<section class="wr-notebook wr-notebook-quick ' + (failed ? 'wr-notebook-blocked' : complete ? 'wr-notebook-complete' : 'wr-notebook-pending') + '" aria-label="Kiểm tra vở"><h5>' + escape(quickTitle) + '</h5>' + latestNote +
        (item.overall ? '<div class="wr-copy">' + prose(item.overall) + '</div>' : '<p>' + escape(item.reason || 'Đang chờ kết quả kiểm tra vở.') + '</p>') +
        (item.submittedAt && !latestSubmission ? '<p class="wr-submitted">Đã nhận vở: ' + escape(submissionDate(item.submittedAt)) + '</p>' : '') + latestSubmission +
        (notebookLinks ? '<details class="wr-notebook-details"><summary>' + (item.publicationFinal ? 'Xem vở đã được kiểm tra' : 'Xem vở lần nộp mới nhất') + '</summary>' + notebookLinks + '</details>' : '') + '</section>';
    }
    if (writingBlocked) return blockedHtml();
    const issues = array(item.issues).map(issue => {
      const pages = [...new Set(array(issue.notebookPages).map(p => Number(p.page)).filter(n => Number.isInteger(n) && n > 0))];
      return '<article class="wr-notebook-issue"><h6>' + escape(issue.section || 'Phần cần bổ sung') + (pages.length ? ' · Vở trang ' + escape(pages.join(', ')) : '') + '</h6>' + prose(issue.evidence) + (issue.action ? '<p class="wr-notebook-action">' + inline(issue.action) + '</p>' : '') + '</article>';
    }).join('');
    const handwriting = array(item.handwriting && item.handwriting.evidence).map(text => '<li>' + inline(text) + '</li>').join('');
    const sources = array(item.sourceUrls).map((value, index) => {
      const url = ieltsWritingAssignments_.safeUrl(typeof value === 'string' ? value : value && value.url);
      return url ? '<a class="wr-button secondary" href="' + escape(url) + '" target="_blank" rel="noopener noreferrer">Tài liệu Cô giao' + (item.sourceUrls.length > 1 ? ' ' + (index + 1) : '') + '</a>' : '';
    }).join('');
    return '<section class="wr-notebook ' + (failed ? 'wr-notebook-blocked' : complete ? 'wr-notebook-complete' : 'wr-notebook-pending') + '" aria-label="Kiểm tra vở"><span class="wr-kicker">Vở chép · Nhận xét của Cô</span><h5>' + escape(title) + '</h5>' + latestNote +
      (item.overall ? '<div class="wr-copy">' + prose(item.overall) + '</div>' : '<p>' + escape(item.reason || 'Vở đang chờ kiểm tra theo tài liệu được giao.') + '</p>') +
      (array(item.nextSteps).length ? '<div class="wr-notebook-steps"><strong>Việc em cần làm</strong><ul>' + item.nextSteps.map(text => '<li>' + inline(text) + '</li>').join('') + '</ul></div>' : '') +
      (issues || handwriting ? '<details class="wr-notebook-details"><summary>Xem phần cần sửa và nhận xét chữ viết</summary>' + issues + (handwriting ? '<h6>Chữ viết và bản chụp</h6><ul>' + handwriting + '</ul>' : '') + '</details>' : '') +
      '<p class="wr-submitted">' + (item.historical && item.reviewSubmittedAt ? 'Vở của nhận xét này: ' + escape(submissionDate(item.reviewSubmittedAt)) : item.submittedAt ? 'Vở nộp: ' + escape(submissionDate(item.submittedAt)) : '') + (item.checkedAt ? ' · Kiểm tra: ' + escape(submissionDate(item.checkedAt)) : '') + '</p>' +
      (item.historical && item.submittedAt && item.submittedAt !== item.reviewSubmittedAt ? '<p class="wr-submitted">Lần nộp mới nhất: ' + escape(submissionDate(item.submittedAt)) + '</p>' : '') + sources + '</section>';
  }
  function overviewHtml() {
    if (!current()) return '';
    const assignments = ieltsWritingAssignments_.all().filter(assignment => hasAssignmentResults(assignment) ||
      array(state.dashboard && state.dashboard.assignments).some(item => ieltsWritingAssignments_.forItem(item)?.assignmentCode === assignment.assignmentCode));
    const content = assignments.length ? '<div class="wr-result-list">' + assignments.map(groupHtml).join('') + '</div>' : status !== 'ready' ? loadStatus() : '<p class="wr-status">Nhận xét sẽ hiện tại đây sau khi bài tập của em được kiểm tra.</p>';
    return '<section class="wr-personal"><header class="fighter-section-head"><span>BÀI LUYỆN TẬP TẠI NHÀ</span><h3>Writing · Bài chữa của Cô</h3><p>Xem nhận xét, chú thích trên bài gốc và bản sửa gợi ý.</p></header>' + content + '</section>';
  }
  function originalHtml(record) {
    const source = record.originalEssay, notes = array(record.annotations), anchors = [];
    notes.forEach((note, index) => array(note.anchors).forEach(anchor => {
      if (Number.isInteger(anchor.start) && Number.isInteger(anchor.end) && anchor.start >= 0 && anchor.end > anchor.start && anchor.end <= source.length && source.slice(anchor.start, anchor.end) === anchor.quote) anchors.push({start:anchor.start,end:anchor.end,index});
    }));
    const cuts = [...new Set([0,source.length,...anchors.flatMap(a => [a.start,a.end])])].sort((a,b) => a-b);
    return cuts.slice(0,-1).map((start,index) => {
      const end = cuts[index+1], active = anchors.filter(a => a.start <= start && a.end >= end).map(a => a.index);
      const text = escape(source.slice(start,end));
      if (!active.length) return text;
      const ids = [...new Set(active)], serious = ids.some(i => notes[i].severity === 'serious');
      return '<button type="button" class="wr-mark' + (serious ? ' is-serious' : '') + '" data-wr-notes="' + ids.join(',') + '" aria-label="Xem chú thích ' + escape(ids.map(i => notes[i].label || String(i + 1)).join(', ')) + '">' + text + '</button>';
    }).join('');
  }
  function notesHtml(record) {
    return array(record.annotations).map((note,index) => '<article class="wr-note' + (note.severity === 'serious' ? ' is-serious' : '') + '" id="wr-note-' + index + '" tabindex="-1"><h5>' + escape(note.label || 'Chú thích ' + (index + 1)) + (note.title ? ' · ' + inline(note.title) : '') + '</h5><div class="wr-copy">' + prose(note.bodyMarkdown) + '</div>' + (array(note.anchors).length ? '<button class="wr-note-jump" type="button" data-wr-back="' + index + '">Về đoạn được chú thích</button>' : '') + '</article>').join('');
  }
  function revisionHtml(record) {
    const paragraphs = array(record.suggestedRevisionParagraphs).map(p => String(p ?? ''));
    const plain = () => paragraphs.map(p => '<p>' + escape(p) + '</p>').join('');
    if (record.revisionKind === 'scaffold' || record.submissionStatus === 'wrong_task') return {
      essay:plain(), legend:'Đây là khung hướng dẫn viết lại đúng đề, chưa phải bản sửa từ bài em đã nộp.'
    };
    const source = record.originalEssay, revised = paragraphs.join('\n\n');
    // Compare exact words and punctuation, ignoring whitespace for matching only.
    // Offset slices always render the saved revision verbatim; no grading text is edited.
    const tokens = text => Array.from(text.matchAll(/[\p{L}\p{M}\p{N}]+(?:['’][\p{L}\p{M}\p{N}]+)*|[^\s]/gu), match => ({text:match[0],start:match.index,end:match.index+match[0].length}));
    const unavailable = {essay:plain(),legend:'Bản sửa được giữ nguyên. Bài quá dài để tô thay đổi chi tiết; em đối chiếu với tab Bài viết gốc - kèm chú thích.'};
    if (source.length + revised.length > 200000) return unavailable;
    const before = tokens(source), after = tokens(revised);
    if (before.length + after.length > 12000) return unavailable;
    let prefix = 0, endBefore = before.length, endAfter = after.length;
    while (prefix < endBefore && prefix < endAfter && before[prefix].text === after[prefix].text) prefix++;
    while (endBefore > prefix && endAfter > prefix && before[endBefore-1].text === after[endAfter-1].text) { endBefore--; endAfter--; }
    const rows = endBefore-prefix, cols = endAfter-prefix;
    // At most ~4 MB and one million comparisons, including malformed long input.
    if ((rows+1)*(cols+1) > 1000000) return unavailable;
    const table = new Uint32Array((rows+1)*(cols+1)), stride = cols+1;
    for (let i=rows-1;i>=0;i--) for (let j=cols-1;j>=0;j--) table[i*stride+j] = before[prefix+i].text === after[prefix+j].text
      ? table[(i+1)*stride+j+1]+1 : Math.max(table[(i+1)*stride+j],table[i*stride+j+1]);
    const changed = new Set(); let i=0,j=0,deleted=0;
    while (i<rows || j<cols) {
      if (i<rows && j<cols && before[prefix+i].text === after[prefix+j].text) {i++;j++;}
      else if (i<rows && (j===cols || table[(i+1)*stride+j] >= table[i*stride+j+1])) {i++;deleted++;}
      else {changed.add(prefix+j);j++;}
    }
    const intervals = [];
    after.forEach((token,index) => {
      if (!changed.has(index)) return;
      const previous = intervals[intervals.length-1];
      if (previous && changed.has(index-1)) previous.end=token.end;
      else intervals.push({start:token.start,end:token.end});
    });
    let offset=0;
    const essay = paragraphs.map(paragraph => {
      const start=offset,end=start+paragraph.length; offset=end+2;
      let cursor=start,html='';
      intervals.forEach(interval => {
        const from=Math.max(start,interval.start),to=Math.min(end,interval.end);
        if (from>=to) return;
        html+=escape(revised.slice(cursor,from))+'<mark class="wr-revision-change">'+escape(revised.slice(from,to))+'</mark>';cursor=to;
      });
      return '<p>'+html+escape(revised.slice(cursor,end))+'</p>';
    }).join('');
    const legend = intervals.length ? 'Phần tô xanh và gạch chân là chỗ Cô đã sửa hoặc bổ sung so với bài em nộp.'
      : deleted ? 'Bản sửa có lược bỏ từ hoặc dấu câu; những từ và dấu câu còn lại được giữ nguyên.'
      : 'Bản sửa giữ nguyên các từ và dấu câu của bài em nộp.';
    return {essay,legend:legend+(deleted ? ' Phần đã lược bỏ không xuất hiện trong bản sửa; em đối chiếu ở tab Bài viết gốc - kèm chú thích.' : '')};
  }
  function cachedRevisionHtml(record) {
    const cached = revisionCache.get(record.resultId);
    if (cached) return cached;
    const revision = revisionHtml(record);
    revisionCache.set(record.resultId, revision);
    return revision;
  }
  function warmReviewButton(target) {
    const button = target?.closest?.('[data-wr-open]');
    if (!button) return;
    const record = reviews.find(review => review.resultId === button.dataset.wrOpen);
    if (!record || revisionCache.has(record.resultId)) return;
    const warm = () => {
      if (current() && reviews.includes(record) && !revisionCache.has(record.resultId)) cachedRevisionHtml(record);
    };
    if ('requestIdleCallback' in window) window.requestIdleCallback(warm, {timeout:350});
    else setTimeout(warm, 0);
  }
  function observeReviewButtons() {
    clearTimeout(reviewWarmTimer);
    reviewWarmTimer = setTimeout(() => {
      const buttons = document.querySelectorAll('[data-wr-open]');
      if (!buttons.length) return;
      if (!('IntersectionObserver' in window)) { warmReviewButton(buttons[0]); return; }
      if (!reviewWarmObserver) reviewWarmObserver = new IntersectionObserver(items => items.forEach(item => {
        if (!item.isIntersecting) return;
        reviewWarmObserver?.unobserve(item.target);
        warmReviewButton(item.target);
      }), {rootMargin:'700px 0px'});
      buttons.forEach(button => {
        if (button.dataset.wrWarmObserved === '1') return;
        button.dataset.wrWarmObserved = '1'; reviewWarmObserver.observe(button);
      });
    }, 0);
  }
  function promptHtml(assignment, task) {
    const label = task.displayLabel || 'Đề ' + task.taskNumber;
    return '<section class="wr-section wr-prompt"><h3>Đề bài gốc · ' + escape(label) + '</h3>' +
      (task.title ? '<h4>' + escape(task.title) + '</h4>' : '') +
      (task.promptText ? '<div class="wr-prompt-text" lang="en">' + escape(task.promptText) + '</div>' : '<p class="wr-status">Đề gốc đang được cập nhật.</p>') +
      (task.imageUrl ? '<figure><img class="wr-prompt-image" src="' + escape(task.imageUrl) + '" alt="Biểu đồ gốc · ' + escape(assignment.weekCode + ' · ' + label + (task.title ? ': ' + task.title : '')) + '" loading="lazy" decoding="async" referrerpolicy="no-referrer"></figure>' : '') +
      (task.sourceUrl ? '<a class="wr-source-link" href="' + escape(task.sourceUrl) + '" target="_blank" rel="noopener noreferrer">Mở đề gốc trong bài học</a>' : '') + '</section>';
  }
  function task2CriteriaHtml(record) {
    return '<section class="wr-section wr-task2-criteria"><h3>Yêu cầu bài luyện Task 2</h3><div class="wr-task2-grid">' + array(record.task2.criteria).map(item =>
      '<article><h4>' + inline(item.title) + '</h4><span class="wr-verdict">' + escape(item.status) + '</span><div class="wr-copy">' + prose(item.comment) +
      (item.action ? '<p><strong>Cách sửa:</strong> ' + inline(item.action) + '</p>' : '') +
      (array(item.evidence).length ? '<details><summary>Xem câu trong bài em</summary>' + item.evidence.map(quote => '<blockquote lang="en">' + escape(quote) + '</blockquote>').join('') + '</details>' : '') + '</div></article>').join('') + '</div></section>';
  }
  function task2OutlineHtml(record) {
    return '<section class="wr-section wr-task2-outline"><h3>Bám sát ý Cô đã cho</h3><details><summary>Xem đối chiếu các ý trong bài</summary><div class="wr-task2-grid">' + array(record.task2.outlineCoverage).map(item =>
      '<article><p class="wr-copy">' + inline(item.requiredText) + '</p><span class="wr-verdict">' + escape(item.status) + '</span><div class="wr-copy">' + prose(item.comment) +
      array(item.studentQuotes).map(quote => '<blockquote lang="en">' + escape(quote) + '</blockquote>').join('') + '</div></article>').join('') + '</div></details></section>';
  }
  function knowledgeHtml(record, knowledgeRows) {
    if(record.savedModelResult) return '';
    if (record.taskType === 2) return '<section class="wr-section"><h3>Kiến thức đã được ghi chép và giảng kỹ</h3><div class="wr-task2-grid">' + array(record.task2.appliedKnowledge).map(item =>
      '<article class="wr-copy">' + prose(item.explanation) + '<blockquote lang="en">' + escape(item.revisionEvidence) + '</blockquote></article>').join('') + '</div></section>';
    return '<section class="wr-section"><h3>Kiến thức đã được ghi chép và giảng kỹ</h3><div class="wr-knowledge"><table><thead><tr><th scope="col">Kỹ thuật</th><th scope="col">Mức vận dụng</th><th scope="col">Bằng chứng</th></tr></thead><tbody>' + knowledgeRows.map(row => '<tr><td>' + inline(row.technique) + '</td><td>' + inline(row.application) + '</td><td>' + inline(row.evidence) + '</td></tr>').join('') + '</tbody></table></div></section>';
  }
  function open(resultId, button) {
    if (!current()) return;
    const record = savedReviews.get(resultId) || reviews.find(review => review.resultId === resultId); if (!record || !validRecord(record)) return;
    const assignment = ieltsWritingAssignments_.all().find(entry => entry.assignmentCode === code(record.assignmentCode));
    const task = assignment && assignment.tasks.find(entry => entry.taskNumber === Number(record.taskNumber));
    if (!task || writingBlockedByPolicy(assignment.assignmentCode)) return;
    if (dialog) { close(); dialog.remove(); }
    selectedReview = record; opener = button; scrollBefore = document.body.style.overflow;
    dialog = document.createElement('dialog'); dialog.className = 'wr-dialog'; dialog.setAttribute('aria-labelledby','wr-title');
    dialog.dataset.wrAssignment = assignment.assignmentCode;
    const knowledgeRows = array(record.knowledge && record.knowledge.rows);
    const revisionLabel = record.revisionLabel || 'Bản sửa gợi ý';
    const revision = cachedRevisionHtml(record);
    dialog.innerHTML = '<header class="wr-head"><div><span class="wr-kicker">' + escape(record.className) + ' · ' + escape(assignment.weekCode) + ' · ' + escape(task.displayLabel || 'Đề ' + task.taskNumber) + '</span><h2 id="wr-title">Bài chữa của Cô</h2><p>' + escape(record.studentName) + '</p></div><button class="wr-close" type="button" aria-label="Đóng bài chữa" data-wr-close>×</button></header>' +
      '<div class="wr-body"><div class="wr-top"><span class="wr-verdict">' + escape(record.learningVerdict) + '</span>' + (record.submissionStatus === 'wrong_task' ? '<strong class="wr-wrong-task">Bài nộp chưa đúng đề</strong>' : '') + '<small>Bài gốc: ' + escape(record.originalWordCount) + ' từ</small><small data-wr-review-label>' + (isCurrentReview(record) ? 'Đã trả bài' : 'Bài chữa lần nộp trước') + '</small></div><div data-wr-freshness>' + freshnessHtml(record.assignmentCode, record.taskNumber, record) + '</div>' +
      promptHtml(assignment,task) +
      (record.taskType === 2 ? '<section class="wr-section"><h3>Nhận xét của Cô</h3>' + overallHtml(record) + '</section>' + task2CriteriaHtml(record) + task2OutlineHtml(record) : '<div class="wr-context"><section class="wr-section"><h3>Nhận xét của Cô</h3>' + overallHtml(record) + '</section><section class="wr-section"><h3>' + (record.savedModelResult ? 'Vận dụng kiến thức đã học' : 'Cách em chia dữ liệu') + '</h3><div class="wr-copy">' + prose(record.dataGrouping) + '</div></section></div>') +
      '<section class="wr-section wr-writing"><header class="wr-writing-head"><h3>Bài em đã nộp</h3><div class="wr-tabs" role="tablist" aria-label="Phiên bản bài viết"><button class="wr-tab" type="button" role="tab" id="wr-tab-original" aria-controls="wr-original" aria-selected="true" data-wr-tab="original">Bài viết gốc - kèm chú thích</button><button class="wr-tab" type="button" role="tab" id="wr-tab-revision" aria-controls="wr-revision" aria-selected="false" tabindex="-1" data-wr-tab="revision">' + escape(revisionLabel) + '</button></div></header>' +
      '<div class="wr-pane" id="wr-original" role="tabpanel" aria-labelledby="wr-tab-original"><div class="wr-original-grid"><div class="wr-essay-col"><p class="wr-essay-hint">Chọn phần được đánh dấu để đọc chú thích của Cô. Màu đỏ là lỗi cần sửa trước.</p><div class="wr-essay" lang="en">' + originalHtml(record) + '</div></div><aside class="wr-notes" aria-label="Chú thích của Cô"><h4>' + array(record.annotations).length + ' chú thích</h4>' + notesHtml(record) + '</aside></div></div>' +
      '<div class="wr-pane" id="wr-revision" role="tabpanel" aria-labelledby="wr-tab-revision" hidden><div class="wr-revision">' + (record.revisionKind === 'scaffold' ? '<p class="wr-scaffold-label">' + escape(revisionLabel) + '</p>' : '') + '<p class="wr-essay-hint">' + escape(record.suggestedRevisionWordCount) + ' từ · Đọc cách sửa và vận dụng kiến thức vào bài của em.</p><p class="wr-revision-legend" id="wr-revision-legend">' + escape(revision.legend) + '</p><div class="wr-essay" lang="en" aria-describedby="wr-revision-legend">' + revision.essay + '</div><div class="wr-applied"><h4>Kiến thức đã áp dụng</h4><ul class="wr-copy">' + array(record.appliedKnowledge).map(item => '<li>' + inline(item) + '</li>').join('') + '</ul></div></div></div></section>' +
      knowledgeHtml(record,knowledgeRows) +
      (array(record.nextSteps).length ? '<section class="wr-section"><h3>Việc em làm tiếp</h3><ol class="wr-next wr-copy">' + array(record.nextSteps).map(step => '<li>' + inline(step) + '</li>').join('') + '</ol></section>' : '') + '<div class="wr-scope">' + prose(record.scopeMarkdown) + '</div></div>';
    document.body.appendChild(dialog); dialog.showModal(); document.body.style.overflow = 'hidden';
    dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
    dialog.addEventListener('close', () => { document.body.style.overflow = scrollBefore; });
    dialog.addEventListener('click', event => { if (event.target === dialog) { const r=dialog.getBoundingClientRect(); if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom) close(); } });
    dialog.querySelector('[data-wr-close]').focus();
  }
  function activateTab(name, focus) {
    if (!dialog) return;
    dialog.querySelectorAll('[data-wr-tab]').forEach(tab => { const active=tab.dataset.wrTab===name; tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;if(active&&focus)tab.focus(); });
    dialog.querySelectorAll('.wr-pane').forEach(pane => { pane.hidden = pane.id !== 'wr-'+name; });
  }
  function selectNotes(indexes, returnToEssay) {
    if (!dialog || !selectedReview) return;
    const ids = indexes.filter(i => Number.isInteger(i) && i >= 0 && i < array(selectedReview.annotations).length);
    dialog.querySelectorAll('.wr-note').forEach((note,index) => note.classList.toggle('is-selected',ids.includes(index)));
    dialog.querySelectorAll('[data-wr-notes]').forEach(mark => mark.classList.toggle('is-selected',mark.dataset.wrNotes.split(',').some(i => ids.includes(Number(i)))));
    const target=returnToEssay ? [...dialog.querySelectorAll('[data-wr-notes]')].find(mark => mark.dataset.wrNotes.split(',').some(i => ids.includes(Number(i)))) : dialog.querySelector('#wr-note-'+ids[0]);
    if(target){target.scrollIntoView({block:'nearest',behavior:'smooth'});target.focus({preventScroll:true});}
  }
  document.addEventListener('pointerover', event => warmReviewButton(event.target), true);
  document.addEventListener('focusin', event => warmReviewButton(event.target), true);
  document.addEventListener('touchstart', event => warmReviewButton(event.target), {capture:true,passive:true});
  document.addEventListener('click', event => {
    const button=event.target.closest('button'); if(!button)return;
    if(button.hasAttribute('data-wr-open'))open(button.dataset.wrOpen,button);
    else if(button.hasAttribute('data-wr-retry')){status='idle';refresh(true);repaint();}
    else if(button.hasAttribute('data-wr-close'))close();
    else if(button.hasAttribute('data-wr-tab'))activateTab(button.dataset.wrTab,false);
    else if(button.hasAttribute('data-wr-notes'))selectNotes(button.dataset.wrNotes.split(',').map(Number),false);
    else if(button.hasAttribute('data-wr-back'))selectNotes([Number(button.dataset.wrBack)],true);
  });
  document.addEventListener('keydown', event => {
    if(!dialog||!dialog.open||!event.target.matches('[data-wr-tab]')||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    event.preventDefault();activateTab(event.key==='Home'?'original':event.key==='End'?'revision':event.target.dataset.wrTab==='original'?'revision':'original',true);
  });
  window.addEventListener('hashchange',clear);window.addEventListener('pagehide',clear);
  const baseLock=ieltsParentLock_;
  ieltsParentLock_=function(){clear();return baseLock.apply(this,arguments);};
  const baseRender=parentRender_;
  parentRender_=function(){const result=baseRender.apply(this,arguments);if(who())refresh();observeReviewButtons();return result;};
  const baseResume=parentQuietResume_;
  parentQuietResume_=async function(){const result=await baseResume.apply(this,arguments);if(who())refresh(true);return result;};
  window.setInterval(() => {
    // The first read can fail too; refresh() throttles retries until it succeeds.
    if (document.visibilityState === 'hidden' || !current() || inFlight) return;
    refresh();
  }, 30000);
  const baseOverview=renderOverview;
  renderOverview=function(){const result=baseOverview.apply(this,arguments);const host=document.getElementById('panel-overview');if(host&&state.student&&who())putOverviewWriting(host,overviewHtml());return result;};
  /* WRITING_OVERVIEW_SLOT_V1: IELTS 51/52 pages have no Ielts50Polish helper; use it when present, else our own slot. */
  function putOverviewWriting(host,html){const polish=window.Ielts50Polish;if(polish&&typeof polish.updateWriting==="function")return polish.updateWriting(host,html);let slot=host.querySelector("#ielts-writing-overview");if(!slot){slot=document.createElement("section");slot.id="ielts-writing-overview";host.appendChild(slot);}if(slot.__writingHtml===html)return;slot.__writingHtml=html;slot.innerHTML=html;}
  function savedResultCard(record) {
    if(!current() || !validRecord(record) || writingBlockedByPolicy(record.assignmentCode)) return '';
    const assignment=ieltsWritingAssignments_.all().find(a=>a.assignmentCode===code(record.assignmentCode));
    const task=assignment?.tasks.find(t=>t.taskNumber===Number(record.taskNumber));
    if(!task) return '';
    const existing=savedReviews.get(record.resultId);
    if(existing && JSON.stringify(existing)===JSON.stringify(record)) record=existing;
    savedReviews.set(record.resultId,record);
    return card(record,assignment,task);
  }
  return {assignmentHtml,homeworkStatusHtml,refresh,clear,savedResultCard};
})();
/* IELTS_WRITING_FEEDBACK_END_V1 */

/* IELTS_WRITING_MODULE_HOOK_V1: same placement as the built-in Writing module of IELTS 45–50 —
   the review/notebook panel is appended to the pupil's homework status inside the "Nhận xét cá nhân" column. */
(function(root){'use strict';
 var n=String(typeof ieltsParentAccess!=='undefined'?ieltsParentAccess.className:'').replace(/\D/g,'');
 var name='ielts'+n+'AssignmentStatusHtml_',orig=root[name];
 if(!n||typeof orig!=='function'||orig.__ieltsWritingHook)return;
 var wrapped=function(item){var html=orig.apply(this,arguments);try{return ieltsWritingReviews_.homeworkStatusHtml(item,html);}catch(e){return html;}};
 wrapped.__ieltsWritingHook=true;root[name]=wrapped;
})(window);
