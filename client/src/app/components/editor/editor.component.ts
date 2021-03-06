import { Component, OnInit } from '@angular/core';
import {CollaborationService} from "../../services/collaboration.service";
import {ActivatedRoute} from "@angular/router";
import {DataService} from "../../services/data.service";

declare var ace: any; // import ace
const DEBUGMODE: boolean = false;

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css']
})
export class EditorComponent implements OnInit {
  languages = ["Java", "C++", "Python"];
  defaultContent = {
    'Java': `public class Solution {
    
    public static void main(String[] args) {
        
    }
}`,
    'C++': `#include <iostream>
    using namespace std;
    ​
    int main() {
       // Type your C++ code here
       return 0;
}`,
    'Python': `class Solution:
    def example():
        # Write your Python code here`
  }
  aceModeName = {
    'Java': 'java',
    'C++': 'c_cpp',
    'Python': 'python'
  }

  editor: any;
  lang: string = "Java";
  output: string;

  constructor(private collaboration: CollaborationService,
              private route: ActivatedRoute,
              private data: DataService) { }

  ngOnInit() {
    this.editor = ace.edit("editor");
    this.editor.setTheme("ace/theme/xcode");
    this.resetEditor();
    // avoid bug when editor holds too many chars that out of buffer
    this.editor.$blockScrolling = Infinity;

    // a custome property used to avoid "sequence of" duplicated actions
    this.editor.lastChangeLog = null;

    // record event on editor content change
    this.editor.on("change", (e)=>{
      let changeInfo = JSON.stringify(e);
      if(DEBUGMODE){
        console.log("editor.on(change):\n"+changeInfo);
        console.log("editor.lastChangeLog:\n"+JSON.stringify(this.editor.lastChangeLog));
      }
      if(this.editor.lastChangeLog != e){
        this.editor.lastChangeLog = e;
        this.collaboration.change("text", changeInfo);
      }
    });

    // record event on editor cursor change
    this.editor.getSession().getSelection().on("changeCursor", ()=>{
      let cursor = this.editor.getSession().getSelection().getCursor();
      this.collaboration.change("cursor", JSON.stringify(cursor));
    });

    this.route.params.subscribe(params => this.collaboration.init(this.editor, params['id']) );
  }

  resetEditor() {
    // set the programming language
    this.editor.getSession().setMode("ace/mode/"+this.aceModeName[this.lang]);

    // fill the editor with default content at start
    this.editor.setValue(this.defaultContent[this.lang]);

    // move cursor to first line
    this.editor.gotoLine(0);
    this.output = "";
  }

  setLanguage() {
    this.resetEditor();
  }

  submit(){
    let testCode = {
      user_code: this.editor.getValue(),
      lang: this.lang.toLowerCase()
    };
    this.data.buildAndRun(testCode)
      .then(res => this.output = res.text);
  }

}
