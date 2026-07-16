/**
 * tempo-directory-seed.ts
 * Tempo simulation prospect-directory seed config (Rehearse Essentials).
 */

import { TEMPO_SIMULATION_ID } from "../../lib/constants";
import type { DirectoryConfig } from "../generate-prospect-directory";

export const tempoDirectorySeed: DirectoryConfig = {
  simulationId: TEMPO_SIMULATION_ID,
  target: {
    companyName: "Summit Dental Group",
    contactName: "Dana Reyes",
    contactTitle: "Director of Operations",
    industry: "Dental",
    sizeLocations: "8 locations",
    signalHint:
      "Opened an 8th location 3 months ago; scheduling still runs on a shared phone-based calendar",
    hiddenClaim:
      "Two front-desk staff have reportedly left this year, reportedly tied to phone-scheduling overload",
  },
  craftedDecoys: [
    {
      companyName: "BrightSmile Dental Partners",
      contactName: "J. Alvarez",
      contactTitle: "Office Manager",
      industry: "Dental",
      sizeLocations: "6 locations",
      signalHint: "Expanded to current size about 2 years ago; no recent changes reported",
      hiddenClaim:
        "Staff have mentioned wanting better software, but no budget has been allocated",
    },
    {
      companyName: "Northview Family Dentistry",
      contactName: "R. Chen",
      contactTitle: "Practice Manager",
      industry: "Dental",
      sizeLocations: "3 locations",
      signalHint: "Already uses a scheduling tool (SlotEasy); no reported complaints",
      hiddenClaim:
        "One location has slightly higher no-show rates than the others, but this hasn't been raised as a concern internally",
    },
    {
      companyName: "Golden State Dental Alliance",
      contactName: "M. Torres",
      contactTitle: "Regional Director",
      industry: "Dental",
      sizeLocations: "12 locations",
      signalHint: "Recently reduced administrative staff as part of a cost-cutting initiative",
      hiddenClaim:
        "Leadership is reportedly cautious about new software spend given the recent cuts",
    },
  ],
  fillerCount: 47,
  industryPool: [
    "Dental",
    "Veterinary",
    "Physical Therapy",
    "Optometry",
    "Med Spa",
    "Chiropractic",
  ],
  namePrefixPool: [
    "Northview",
    "Brightside",
    "Lakeside",
    "Cedar Grove",
    "Riverside",
    "Union Square",
    "Maple",
    "Harbor",
    "Crestview",
    "Fairview",
    "Hillcrest",
    "Parkway",
    "Meadowbrook",
    "Stonebridge",
    "Oakhurst",
  ],
  suffixByIndustry: {
    Dental: ["Dental Group", "Family Dentistry", "Dental Care"],
    Veterinary: ["Veterinary Partners", "Animal Hospital"],
    "Physical Therapy": ["Physical Therapy", "Rehab Partners"],
    Optometry: ["Eye Care", "Vision Group"],
    "Med Spa": ["Med Spa", "Aesthetics"],
    Chiropractic: ["Chiropractic Center", "Wellness Group"],
  },
  contactTitlePool: ["Office Manager", "Practice Manager", "Operations Coordinator"],
  contactLastNamePool: [
    "Alvarez",
    "Chen",
    "Torres",
    "Nguyen",
    "Patel",
    "Johnson",
    "Williams",
    "Garcia",
    "Kim",
    "Martinez",
    "Robinson",
    "Clark",
    "Lewis",
    "Walker",
    "Hall",
    "Young",
    "King",
    "Wright",
    "Scott",
    "Green",
  ],
};
