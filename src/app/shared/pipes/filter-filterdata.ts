import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'searchDataFilterBy'
})
export class FilterSearchByPipe implements PipeTransform {
 constructor(private _sanitizer: DomSanitizer) { }
 transform(items: any[], searchText: string, fields: string): SafeHtml[] {
    
    let fieldsSeprate = fields.split('|');

    if(!items) return [];
    
    if(!searchText) return items;

    searchText = searchText.toLowerCase();
    
    return items.filter( it => {
      
      let searchData = [];

      let fieldToCheck;
      let fieldToInterpret;
      fieldsSeprate.forEach((field)=>{
        
        let splitedFields = field.split('.');
        
        switch (splitedFields.length) {
          case 2:

          if(it[splitedFields[0]]){

            fieldToCheck = it[splitedFields[0]][splitedFields[1]];
            fieldToInterpret = 'it.'+[splitedFields[0]]+'.'+[splitedFields[1]];

          }
          break;

          case 3:
          if(it[splitedFields[0]][splitedFields[1]]){
            fieldToCheck = it[splitedFields[0]][splitedFields[1]][splitedFields[2]];
            fieldToInterpret = 'it.'+[splitedFields[0]]+'.'+[splitedFields[1]]+'.'+[splitedFields[2]];
          }
          break;

          default:

          fieldToCheck = it[splitedFields[0]];
          fieldToInterpret = 'it.'+[splitedFields[0]];

          break;
        }

        if (fieldToCheck != null || fieldToCheck != undefined) {

          searchData.push(fieldToInterpret+'.toString().toLowerCase().includes(searchText)');
        }
      });

      return eval(searchData.join(' || '));

    });
    
  }

  
}
