import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

@NgModule({
    imports: [CommonModule],
    declarations: []
})
export class PipesModule {
    filterFn(key, value) {
        return value;
        // switch (key) {
        //     case ("start_time" || "ts_last_update"):
        //         return value;
        //         break;
        //     default:
        //         // return value;
        // }
    }
}
