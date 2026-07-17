/**
 * tempo-directory-seed.ts
 * Tempo simulation prospect-directory seed config (Rehearse Essentials).
 */

import { TEMPO_SIMULATION_ID } from "../../lib/constants";
import {
  parseSizeNumber,
  resolvePrimaryContactTitle,
  type DirectoryConfig,
} from "../generate-prospect-directory";

export const tempoDirectorySeed: DirectoryConfig = {
  simulationId: TEMPO_SIMULATION_ID,
  corePainDepartment: "Operations",
  target: {
    companyName: "Summit Dental Group",
    industry: "Dental",
    sizeLocations: "8 locations",
    signalHint:
      "Opened an 8th location 3 months ago; scheduling still runs on a shared phone-based calendar",
    hiddenClaim:
      "Two front-desk staff have reportedly left this year, reportedly tied to phone-scheduling overload",
    contactSet: {
      correct: {
        contactName: "Dana Reyes",
        contactTitle: "Director of Operations",
        department: "Operations",
        gender: "female",
      },
      traps: [
        {
          contactName: "Marcus Webb",
          contactTitle: "VP of Finance",
          department: "Finance",
          gender: "male",
          strongerAxis:
            "seniority — VP outranks Director",
          weakerAxis:
            "wrong department — Finance doesn't own scheduling tooling decisions",
        },
        {
          contactName: "Priya Shah",
          contactTitle: "Front Desk Lead",
          department: "Operations",
          gender: "female",
          strongerAxis:
            "closest to the daily pain, same department — operations relevance",
          weakerAxis:
            "no purchasing authority to approve a vendor tool",
        },
      ],
    },
  },
  craftedDecoys: [
    {
      companyName: "BrightSmile Dental Partners",
      industry: "Dental",
      sizeLocations: "6 locations",
      signalHint: "Expanded to current size about 2 years ago; no recent changes reported",
      hiddenClaim:
        "Staff have mentioned wanting better software, but no budget has been allocated",
      strongerAxis:
        "Multi-location dental group, similar profile to the target at a glance",
      weakerAxis:
        "Trigger is stale — expanded 2 years ago, no recent change; contact is Office Manager, lower authority than a real decision-maker",
      contactSet: {
        correct: {
          contactName: "Jordan Alvarez",
          contactTitle: "Office Manager",
          department: "Operations",
          gender: "female",
        },
        traps: [
          {
            contactName: "Wei Zhang",
            contactTitle: "VP of Finance",
            department: "Finance",
            gender: "male",
            strongerAxis:
              "seniority — VP title looks more impressive than Office Manager",
            weakerAxis:
              "wrong department — Finance is not the buyer for scheduling operations tooling",
          },
          {
            contactName: "Fatima Hassan",
            contactTitle: "Front Desk Lead",
            department: "Operations",
            gender: "female",
            strongerAxis:
              "department relevance — same operations team closest to scheduling pain",
            weakerAxis:
              "far lower seniority — cannot authorize a new vendor",
          },
        ],
      },
    },
    {
      companyName: "Northview Family Dentistry",
      industry: "Dental",
      sizeLocations: "3 locations",
      signalHint: "Already uses a scheduling tool (SlotEasy); no reported complaints",
      hiddenClaim:
        "One location has slightly higher no-show rates than the others, but this hasn't been raised as a concern internally",
      strongerAxis: "Real, existing dental business with an identifiable contact",
      weakerAxis:
        "Too small to feel real pain at scale (3 locations), and already using a competitor's tool with no reported complaints",
      contactSet: {
        correct: {
          contactName: "Rachel Chen",
          contactTitle: "Practice Manager",
          department: "Operations",
          gender: "female",
        },
        traps: [
          {
            contactName: "Diego Morales",
            contactTitle: "VP of Finance",
            department: "Finance",
            gender: "male",
            strongerAxis:
              "seniority — VP outranks Practice Manager on paper",
            weakerAxis:
              "wrong department — Finance does not own day-to-day scheduling decisions",
          },
          {
            contactName: "Amara Okonkwo",
            contactTitle: "Front Desk Lead",
            department: "Operations",
            gender: "female",
            strongerAxis:
              "operations department relevance — lives the appointment-booking friction daily",
            weakerAxis:
              "no budget authority despite being closest to the pain",
          },
        ],
      },
    },
    {
      companyName: "Golden State Dental Alliance",
      industry: "Dental",
      sizeLocations: "12 locations",
      signalHint: "Recently reduced administrative staff as part of a cost-cutting initiative",
      hiddenClaim:
        "Leadership is reportedly cautious about new software spend given the recent cuts",
      strongerAxis:
        "Larger than the target (12 locations vs. 8), looks like a bigger, more impressive opportunity",
      weakerAxis:
        "Pain is running in the wrong direction — cost-cutting and staff reduction, not growth strain — so a scaling-focused pitch doesn't land",
      contactSet: {
        correct: {
          contactName: "Miguel Torres",
          contactTitle: "Practice Manager",
          department: "Operations",
          gender: "male",
        },
        traps: [
          {
            contactName: "Elena Kowalski",
            contactTitle: "VP of Finance",
            department: "Finance",
            gender: "female",
            strongerAxis:
              "seniority — VP of Finance outranks Practice Manager",
            weakerAxis:
              "wrong department — cost-cutting finance lead is the wrong owner for scheduling tooling",
          },
          {
            contactName: "Caleb Nguyen",
            contactTitle: "Front Desk Lead",
            department: "Operations",
            gender: "male",
            strongerAxis:
              "department relevance — operations front-line role matching the core pain area",
            weakerAxis:
              "insufficient seniority — cannot green-light a multi-location vendor purchase",
          },
        ],
      },
    },
  ],
  fillerCount: 21,
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
    "Ashford",
    "Birchwood",
    "Clearwater",
    "Dunmore",
    "Elmhurst",
    "Foxglove",
    "Glenwood",
    "Highpoint",
    "Ironwood",
    "Juniper",
    "Kingsley",
    "Laurelton",
    "Millbrook",
    "Norwood",
    "Pinehurst",
    "Quarry Hill",
    "Redstone",
    "Silverlake",
    "Thornbury",
    "Vista Ridge",
    "Westbrook",
    "Willowmere",
    "Ashgrove",
    "Brookfield",
    "Copperfield",
  ],
  suffixByIndustry: {
    Dental: ["Dental Group", "Family Dentistry", "Dental Care"],
    Veterinary: ["Veterinary Partners", "Animal Hospital"],
    "Physical Therapy": ["Physical Therapy", "Rehab Partners"],
    Optometry: ["Eye Care", "Vision Group"],
    "Med Spa": ["Med Spa", "Aesthetics"],
    Chiropractic: ["Chiropractic Center", "Wellness Group"],
  },
  contactTitlePool: [
    "Front Desk Lead",
    "Office Manager",
    "Practice Manager",
    "Operations Coordinator",
  ],
  contactDepartmentPool: [
    "Operations",
    "Finance",
    "Front Desk",
    "Administration",
    "Clinical",
  ],
  contactTitleSeniorityRank: [
    "Front Desk Lead",
    "Office Manager",
    "Practice Manager",
    "Operations Coordinator",
    "Director of Operations",
    "VP of Finance",
    "Regional Director",
    "Owner",
    "Founder",
  ],
  comparableAxes: [
    {
      name: "size",
      keywords: ["size", "location", "locations", "clinic", "clinics", "studio"],
      getValue: (entry) => parseSizeNumber(entry.sizeLocations),
      regenerateFillerValue: (config) => {
        const targetSize = parseSizeNumber(config.target.sizeLocations) ?? 8;
        const newSize =
          Math.floor(Math.random() * Math.max(1, targetSize - 1)) + 1;
        return { sizeLocations: `${newSize} locations` };
      },
    },
    {
      name: "seniority",
      keywords: ["senior", "director", "title", "seniority", "authority"],
      getValue: (entry, config) =>
        config.contactTitleSeniorityRank.indexOf(resolvePrimaryContactTitle(entry)),
      regenerateFillerValue: (config) => {
        const targetRank = config.contactTitleSeniorityRank.indexOf(
          resolvePrimaryContactTitle(config.target)
        );
        const validTitles = config.contactTitlePool.filter(
          (title) => config.contactTitleSeniorityRank.indexOf(title) < targetRank
        );
        const pick = validTitles[Math.floor(Math.random() * validTitles.length)];
        return { contactTitle: pick };
      },
    },
  ],
  contactComparableAxes: [
    {
      name: "seniority",
      keywords: ["senior", "seniority", "vp", "director", "title", "authority", "outrank"],
      getValue: (contact, config) =>
        config.contactTitleSeniorityRank.indexOf(contact.contactTitle),
    },
    {
      name: "department_relevance",
      keywords: ["department", "operations", "relevant", "relevance", "pain"],
      getValue: (contact, config) => {
        // Outside the core-pain department → 0.
        // Inside it, front-line roles score higher than managers so the
        // "same dept / lower seniority" trap can win this axis alone.
        if (contact.department !== config.corePainDepartment) {
          return 0;
        }
        if (contact.contactTitle === "Front Desk Lead") {
          return 2;
        }
        return 1;
      },
    },
  ],
};
