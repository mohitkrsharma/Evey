import { Directive, Input } from "@angular/core";
import { AbstractControl, Validator, NG_VALIDATORS } from "@angular/forms";

@Directive({
  selector: "[checkDuplicatefield]",
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: CheckduplicatefieldDirective,
      multi: true,
    },
  ],
})
export class CheckduplicatefieldDirective implements Validator {
  @Input("checkDuplicatefield") checkDuplicatefield: any = [];

  constructor() { }

  validate(control: AbstractControl): { [key: string]: any } | null {
    let addedValues = this.checkDuplicatefield[0];
    let currentValueIndex = this.checkDuplicatefield[1];
    let isEdit = this.checkDuplicatefield[2];
    // let lengthValue = addedValues.length
    // console.log('----it is in validator----',addedValues)

    // addedValues.forEach((e,ind) =>{
    //   console.log(control.value, e.value)
    //   if(ind == currentValueIndex){
    //     // return null
    //     final_status=null
    //   }else{
    //     if(control.value==e.value){
    //       // console.log('--same--')

    //       if(final_status==null){
    //           final_status = { duplicateExists: true };
    //       }
    //       return { duplicateExists: true };
    //     }else{
    //       // console.log('--else--')
    //       // return null;
    //       final_status=null
    //     }
    //   }
    // })
    // // console.log('-----finallyy-------',final_status)
    // return final_status

    // for(let d of addedValues){
    //   console.log('d',d)
    //   // return null
    //   // if(d.)
    // }

    // let newArray = JSON.parse(JSON.stringify(addedValues))

    // // newArray.splice(currentValueIndex,1)
    // // let isExists = newArray.some((e,i)=>(e.value==control.value && i!=currentValueIndex))
    // let isExists = newArray.filter((e,i)=>e.value==control.value && i!=currentValueIndex)

    // console.log('is exists',isExists)

    // if(isExists.length){
    //   return { duplicateExists: true };
    // }else{
    //   return null
    // }

    let checkExists = addedValues.findIndex(e => (e.id != addedValues[currentValueIndex].id && e.value == control.value))
    if (checkExists != -1) {
      if ((addedValues[currentValueIndex].name == "Fax" && (addedValues[checkExists].name == "Phone" || addedValues[checkExists].name == "Mobile" )) || ((addedValues[currentValueIndex].name == "Phone" || addedValues[currentValueIndex].name == "Mobile") && addedValues[checkExists].name == "Fax")) {
        return null;
      }
      else {
        return { duplicateExists: true };
      }
    } else {
      return null;
    }

    // var index;
    // for (let i = 0; i < this.checkDuplicatefield[0].length; i++) {

    //   if (i == currentValueIndex) {
    //     return null;
    //     // continue;
    //   } else {
    //     console.log('--index--',control.value == this.checkDuplicatefield[0][i].value,control.value , this.checkDuplicatefield[0][i].value)
    //     // console.log(control.value == addedValues[currentValueIndex].value,addedValues[currentValueIndex].value,control.value)

    //     if (control.value == this.checkDuplicatefield[0][i].value) {
    //       // console.log('---same---')
    //       return { duplicateExists: true };
    //     } else {
    //       return null;
    //       // continue
    //     }
    //   }
    // }
  }
}
// 1   [1,2,3,4]
