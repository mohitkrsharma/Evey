/* Importing all the Modules,component,services we need */
import { Injectable } from '@angular/core';
import 'rxjs/add/operator/toPromise';

@Injectable()
export class ConstantsService {


  constructor() { }


  public alertData() {
    const alertData = [
      {
        name: 'Alert',
        priority: 1,
        property: {
          border_color: '#E82627',
          background_color: '#E82627',
          font_color: '#FFFFFF',
          font_size: 17
        },
        icon: 'assets/images/red.png'
      },
      {
        name: 'White / Dark Blue Boarder',
        priority: 2,
        property: {
          border_color: '#0063AB',
          background_color: '#FFFFFF',
          font_color: '#0063AB',
          font_size: 17
        },
        icon: 'assets/images/white.png'
      },
      {
        name: 'Light Blue / Dark Blue Boarder',
        priority: 3,
        property: {
          border_color: '#0063AB',
          background_color: '#E1F4FD',
          font_color: '#0063AB',
          font_size: 17
        },
        icon: 'assets/images/LightBlue.png'
      },
      {
        name: 'Blue / Dark Blue Boarder',
        priority: 4,
        property: {
          border_color: '#0063AB',
          background_color: '#0096D8',
          font_color: '#FFFFFF',
          font_size: 17
        },
        icon: 'assets/images/Blue.png'
      },
      {
        name: 'Dark Blue',
        priority: 5,
        property: {
          border_color: '#0063AB',
          background_color: '#0063AB',
          font_color: '#FFFFFF',
          font_size: 17
        },
        icon: 'assets/images/darkblue.png'
      },
      {
        name: 'White / Red Boarder',
        priority: 6,
        property: {
          border_color: '#E82627',
          background_color: '#ffffff',
          font_color: '#E82627',
          font_size: 17
        },
        icon: 'assets/images/whiteRed.png'
      },
      {
        name: 'Light Grey / Black Boarder',
        priority: 7,
        property: {
          border_color: '#1A1818',
          background_color: '#EEEEEF',
          font_color: '#1A1818',
          font_size: 17
        },
        icon: 'assets/images/lightGrey.png'
      },
      {
        name: 'White / Dark Green Boarder',
        priority: 8,
        property: {
          border_color: '#86c846',
          background_color: '#FFFFFF',
          font_color: '#86c846',
          font_size: 17
        },
        icon: 'assets/images/white-green1.png'
      },
      {
        name: 'Dark Green',
        priority: 9,
        property: {
          border_color: '#86c846',
          background_color: '#86c846',
          font_color: '#FFFFFF',
          font_size: 17
        },
        icon: 'assets/images/darkgreen.png'
      }
    ];
    return alertData;
  }


  public residentStatus() {
    const statusData = [
      { label: 'Active', value: 'Active' },
      { label: 'Deceased', value: 'Deceased' },
      { label: 'Moved', value: 'Moved' },
      { label: 'Transferred', value: 'Transferred' ,isOutOfFacility:true},
      { label: 'Hospitalized', value: 'Hospitalized' },
      // { label: 'Temp Hospitalization', value: 'Temp Hospitalization' },
      { label: 'Vacation', value: 'Vacation' },
      { label: 'Skilled Nursing', value: 'Skilled Nursing',isOutOfFacility:true },
      { label: 'Pending', value: 'Pending' },
      { label: 'Other', value: 'Other' }];
    return statusData;
  }

  public facilityStatus() {
    
    const facilitystatusData = [
      { label: 'Assisted Living', value: 'Assisted Living' },
      { label: 'Independent Living', value: 'Independent Living' },
      { label: 'Skilled Nursing', value: 'Skilled Nursing' },
      { label: 'Memory Care', value: 'Memory Care' }
    ]
    return facilitystatusData;
  }

  public residentCareLevel() {
    const carelevelData = [
      { label: 'Level 1', value: 'Level 1' },
      { label: 'Level 2', value: 'Level 2' },
      { label: 'Level 3', value: 'Level 3' },
      { label: 'Self', value: 'Self' },
      { label: 'Mobility Assistance (All Day)', value: 'Mobility Assistance (All Day)' },
      { label: 'Mobility Assistance (Per Occurrence)', value: 'Mobility Assistance (Per Occurrence)' },
      { label: 'Bathing Assistance', value: 'Bathing Assistance' },
      { label: 'Short Term Stay', value: 'Short Term Stay' },
      { label: 'Short-Term Stay (No Services)', value: 'Short-Term Stay (No Services)' },
      { label: 'Supervision (during waking hours)', value: 'Supervision (during waking hours)' },
      { label: 'Safety and Supervision (24 hours)', value: 'Safety and Supervision (24 hours)' },
    ];
    return carelevelData;
  }

  public residentMoreOption() {
    const moreLinks = {
      name : 'Residents',
      links: [
        { name : 'All Residents' , link: 'residents' },
        { name : 'Create Resident', link: 'residents/form' },
        { name : 'Order List', link: 'residents/order' },
        { name : 'Removed Residents', link: 'residents/removed' },
        { name : 'Deleted Residents', link: 'residents/deleted' },
      ]
    };
    return moreLinks;
  }

  public medicationMoreOption() {
    const moreLinks = {
      name : 'Medications',
      links: [
        { name : 'All Medications' , link: 'medications' },
        { name : 'Create Medication', link: 'medications/form' },
        { name : 'Removed Medications', link: 'medications/removed' },
        { name : 'Deleted Medications', link: 'medications/deleted' },
      ]
    };
    return moreLinks;
  }


}
