import { Component, OnInit } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { ApiService } from "src/app/shared/services/api/api.service";
import { Aes256Service } from "src/app/shared/services/aes-256/aes-256.service";
import { CommonService } from "src/app/shared/services/common.service";

@Component({
	selector: "app-view",
	templateUrl: "./view.component.html",
	styleUrls: ["./view.component.scss"],
})
export class ViewComponent implements OnInit {
	nfcObj;
	id;
	shift;
	constructor(
		private router: Router,
		private route: ActivatedRoute,
		private apiService: ApiService,
		private _aes256Service: Aes256Service,
		public _commonService: CommonService,
	) {}

	async ngOnInit() {
		this._commonService.setLoader(true);
		this.id = this._aes256Service.decFnWithsalt(this.route.params["_value"]["id"]);
		const action = { type: "POST", target: "shift/view" };
		const payload = { shiftId: this.id };
		const result = await this.apiService.apiFn(action, payload);
		this.shift = result["data"];
		this._commonService.setLoader(false);
  }
  
  cancel() {
    this.router.navigate(['/shifts']);
  }
}
