#!/usr/bin/env python3
"""
Repeatable PDF Data Extraction Script for "The Promised Offspring".

Extracts all ~748 embedded jw.org/finder Insight & Scripture link annotations,
normalizes ligatures and doubled drop-shadow labels, maps all 39 rasterized/stylized
banners (13 tribes, 25 Origin of Nations badges, and the bottom Jesus banner) by
bounding-box coordinate, and generates clean enriched JSON datasets under src/data/.

Usage:
    python3 scripts/extract_pdf_data.py --pdf "/tmp/The Promised Offspring.pdf"
"""

import argparse
import json
import os
import re
from pathlib import Path
import pymupdf

# Ligature and typography normalization map
LIGATURE_MAP = {
    "\u0133": "ij",   # ĳ -> ij
    "\u0132": "IJ",   # Ĳ -> IJ
    "\ufb00": "ff",   # ﬀ
    "\ufb01": "fi",   # ﬁ
    "\ufb02": "fl",   # ﬂ
    "\ufb03": "ffi",  # ﬃ
    "\ufb04": "ffl",  # ﬄ
    "\u2019": "'",    # right single quote
    "\u2018": "'",    # left single quote
    "\u2013": "-",    # en dash
    "\u2014": "-",    # em dash
}

# Coordinate-mapped labels for all 39 rasterized/stylized banners (no vector text layer)
# Format: (x0, y0, x1, y1, label, banner_type)
BANNER_COORDS = [
    # 13 Tribe Banners (y ~ 1367..1396)
    (77.5, 1372.9, 129.4, 1393.5, "Manasseh", "tribe"),
    (172.5, 1370.6, 214.4, 1391.2, "Ephraim", "tribe"),
    (300.5, 1369.5, 347.4, 1390.2, "Benjamin", "tribe"),
    (601.6, 1369.5, 622.2, 1390.2, "Levi", "tribe"),
    (844.0, 1367.6, 884.9, 1395.2, "Judah", "tribe"),
    (1105.2, 1369.5, 1144.6, 1390.2, "Reuben", "tribe"),
    (1177.2, 1369.5, 1215.3, 1390.2, "Simeon", "tribe"),
    (1247.9, 1369.5, 1288.6, 1390.2, "Zebulun", "tribe"),
    (1319.0, 1369.5, 1361.5, 1390.2, "Issachar", "tribe"),
    (1398.2, 1369.5, 1427.6, 1390.2, "Asher", "tribe"),
    (1474.3, 1369.5, 1495.6, 1390.2, "Gad", "tribe"),
    (1536.3, 1369.5, 1577.5, 1390.2, "Naphtali", "tribe"),
    (1618.6, 1369.5, 1639.2, 1390.2, "Dan", "tribe"),
    # Bottom Jesus Banner
    (851.9, 2464.8, 930.3, 2519.9, "Jesus", "jesus"),
    # 25 Origin of Nations Badges
    (411.3, 610.7, 452.7, 622.2, "Cushites", "nation"),
    (480.5, 588.2, 527.5, 599.7, "Egyptians", "nation"),
    (541.9, 588.2, 592.1, 599.7, "Philistines", "nation"),
    (559.0, 480.2, 593.0, 491.7, "Libyans", "nation"),
    (621.8, 521.8, 674.2, 533.2, "Canaanites", "nation"),
    (589.4, 697.7, 634.6, 709.2, "Phoenicia", "nation"),
    (667.9, 697.7, 718.1, 709.2, "Gibeonites", "nation"),
    (699.7, 480.2, 740.3, 491.7, "Elamites", "nation"),
    (759.5, 480.2, 806.5, 491.7, "Assyrians", "nation"),
    (778.2, 548.6, 819.6, 560.1, "Hebrews", "nation"),
    (927.8, 480.2, 962.2, 491.7, "Lydians", "nation"),
    (995.7, 547.7, 1020.3, 559.2, "Syria", "nation"),
    (958.1, 723.2, 985.9, 734.7, "Arabs (Joktan)", "nation"),
    (1053.8, 534.2, 1106.2, 545.7, "Cimmerians", "nation"),
    (1128.5, 480.2, 1175.5, 491.7, "Scythians", "nation"),
    (1209.4, 480.2, 1238.6, 491.7, "Medes", "nation"),
    (1204.9, 547.7, 1243.1, 559.2, "Iberians", "nation"),
    (1278.9, 547.7, 1313.1, 559.2, "Greeks", "nation"),
    (1343.2, 480.2, 1392.8, 491.7, "Georgians", "nation"),
    (1415.9, 480.2, 1464.1, 491.7, "Phrygians", "nation"),
    (1488.3, 480.2, 1535.7, 491.7, "Thracians", "nation"),
    (464.8, 952.7, 507.2, 964.2, "Moabites", "nation"),
    (524.2, 952.7, 573.8, 964.2, "Ammonites", "nation"),
    (1120.1, 1042.7, 1147.9, 1054.2, "Arabs (Ishmael)", "nation"),
    (1229.6, 1292.3, 1272.4, 1303.8, "Edomites", "nation"),
]

# Known multi-word bleed / PDF typo fixes (keyed by normalized raw text)
LABEL_FIXES = {
    "Timnah Amalek": "Amalek",
    "Zichri Nepheg": "Nepheg",
    "Ozem Ahijah": "Ahijah",
    "Hoglah Tirzah": "Tirzah",
    "Adam 4026 - 3096 : 930": "Adam",
    "Bablyon": "Babylon",
    "Legal": "Legal Lineage (Matthew 1:1-17)",
    "Natural": "Natural Lineage (Luke 3:23-38)",
    "(Ezekiel 4:5)": "Ezekiel 4:5 (390 Years)",
    "Daughter": "Daughter of Machir",
    "Daniel": "Daniel",
    "[Jerioth]": "Jerioth",
}

# Curated Insight profiles for key figures across the chart
CURATED_PROFILES = {
    "Adam": {
        "birthYear": -4026, "deathYear": -3096, "lifespan": 930, "era": "eden",
        "role": "First Human & Father of Mankind",
        "summary": "Created directly by Jehovah in 4026 B.C.E. in the Garden of Eden. His disobedience introduced sin and death to humanity, prompting God's very first Messianic promise at Genesis 3:15.",
        "scriptures": ["Genesis 2:7", "Genesis 3:15-19", "Genesis 5:3-5", "1 Corinthians 15:45"]
    },
    "Eve": {
        "birthYear": -4026, "deathYear": None, "lifespan": None, "era": "eden",
        "role": "First Woman & Mother of Everyone Living",
        "summary": "Created as a complement to Adam in Eden. Though deceived by the serpent, Jehovah promised that an 'offspring' would ultimately crush the serpent's head.",
        "scriptures": ["Genesis 2:22", "Genesis 3:15", "Genesis 3:20", "Genesis 4:1"]
    },
    "Seth": {
        "birthYear": -3896, "deathYear": -2984, "lifespan": 912, "era": "eden",
        "role": "Appointed Son & Pre-Flood Patriarch",
        "summary": "Born to Adam and Eve when Adam was 130 years old, appointed by God in place of righteous Abel. All post-Flood humanity traces back through Seth's line.",
        "scriptures": ["Genesis 4:25-26", "Genesis 5:3-8", "Luke 3:38"]
    },
    "Enosh": {
        "birthYear": -3791, "deathYear": -2886, "lifespan": 905, "era": "eden",
        "role": "Son of Seth, Pre-Flood Patriarch",
        "summary": "Born when Seth was 105 years old. During Enosh's lifetime people began calling on the name of Jehovah (Genesis 4:26).",
        "scriptures": ["Genesis 4:26", "Genesis 5:6-11", "Luke 3:38"]
    },
    "Kenan": {
        "birthYear": -3701, "deathYear": -2791, "lifespan": 910, "era": "eden",
        "role": "4th Generation from Adam",
        "summary": "Son of Enosh and father of Mahalalel; lived 910 years in the pre-Flood era, overlapping with Adam for over 600 years.",
        "scriptures": ["Genesis 5:9-14", "1 Chronicles 1:2", "Luke 3:37"]
    },
    "Mahalalel": {
        "birthYear": -3631, "deathYear": -2736, "lifespan": 895, "era": "eden",
        "role": "5th Generation from Adam",
        "summary": "Son of Kenan and father of Jared. His name means 'Praise of God,' preserving the faithful patriarchal link before the Flood.",
        "scriptures": ["Genesis 5:12-17", "1 Chronicles 1:2", "Luke 3:37"]
    },
    "Jared": {
        "birthYear": -3566, "deathYear": -2604, "lifespan": 962, "era": "eden",
        "role": "6th Generation, Second-Longest Lifespan",
        "summary": "Father of Enoch and the second-longest-lived person recorded in the Bible at 962 years, witnessing both Adam and Noah.",
        "scriptures": ["Genesis 5:15-20", "Luke 3:37"]
    },
    "Enoch": {
        "birthYear": -3404, "deathYear": -3039, "lifespan": 365, "era": "eden",
        "role": "Seventh in Line from Adam & Prophet",
        "summary": "Walked with the true God and boldly prophesied Jehovah's judgment against an ungodly pre-Flood world. God transferred him so he would not see death.",
        "scriptures": ["Genesis 5:21-24", "Hebrews 11:5", "Jude 14-15"]
    },
    "Methuselah": {
        "birthYear": -3339, "deathYear": -2370, "lifespan": 969, "era": "eden",
        "role": "Longest-Lived Human in Scripture (969 yrs)",
        "summary": "Son of Enoch and grandfather of Noah. Remarkably, Methuselah overlapped with Adam for 243 years and died in 2370 B.C.E., the exact year of the Global Flood.",
        "scriptures": ["Genesis 5:21-27", "Luke 3:37"]
    },
    "Lamech": {
        "birthYear": -3152, "deathYear": -2375, "lifespan": 777, "era": "eden",
        "role": "Father of Noah",
        "summary": "Son of Methuselah who prophetically named his son Noah ('Rest / Consolation'), anticipating relief from the cursed ground. Died just 5 years before the Flood.",
        "scriptures": ["Genesis 5:25-31", "Luke 3:36"]
    },
    "Noah": {
        "birthYear": -2970, "deathYear": -2020, "lifespan": 950, "era": "flood",
        "role": "Preacher of Righteousness & Ark Builder",
        "summary": "Found favor in Jehovah's eyes amidst a violent pre-Flood world. Built the ark, survived the Global Flood of 2370 B.C.E. with his family, and became the forefather of all post-Flood nations. Died just 2 years before Abraham was born.",
        "scriptures": ["Genesis 6:8-9", "Genesis 7:11", "Genesis 9:1-29", "Hebrews 11:7"]
    },
    "Shem": {
        "birthYear": -2468, "deathYear": -1868, "lifespan": 600, "era": "flood",
        "role": "Blessed Son of Noah & Ancestor of the Semites",
        "summary": "Blessed directly by Noah ('Praised be Jehovah, the God of Shem'). Survived the Flood at age 98 and lived 502 years after it — overlapping with Abraham for 150 years and Isaac for 50 years!",
        "scriptures": ["Genesis 9:26-27", "Genesis 11:10-11", "Luke 3:36"]
    },
    "Arpachshad": {
        "birthYear": -2368, "deathYear": -1930, "lifespan": 438, "era": "flood",
        "role": "First Post-Flood Heir of the Promise",
        "summary": "Born to Shem two years after the Global Flood (2368 B.C.E.), continuing the Messianic lineage into the renewed earth.",
        "scriptures": ["Genesis 11:10-13", "Luke 3:36"]
    },
    "Shelah": {
        "birthYear": -2333, "deathYear": -1900, "lifespan": 433, "era": "flood",
        "role": "Post-Flood Patriarch",
        "summary": "Son of Arpachshad and father of Eber, bridging the early post-Flood generations.",
        "scriptures": ["Genesis 11:12-15", "1 Chronicles 1:18", "Luke 3:35"]
    },
    "Eber": {
        "birthYear": -2303, "deathYear": -1839, "lifespan": 464, "era": "flood",
        "role": "Eponymous Ancestor of the Hebrews",
        "summary": "Great-grandson of Shem from whom the designation 'Hebrew' derives. Remarkably, Eber outlived Abraham by 4 years!",
        "scriptures": ["Genesis 10:21", "Genesis 11:14-17", "Genesis 14:13"]
    },
    "Peleg": {
        "birthYear": -2269, "deathYear": -2030, "lifespan": 239, "era": "flood",
        "role": "Patriarch of the Division of Babel",
        "summary": "Named Peleg ('Division') because 'in his lifetime the earth was divided' when Jehovah confused human languages at the Tower of Babel.",
        "scriptures": ["Genesis 10:25", "Genesis 11:16-19", "Luke 3:35"]
    },
    "Reu": {
        "birthYear": -2239, "deathYear": -2000, "lifespan": 239, "era": "flood",
        "role": "Post-Babel Patriarch",
        "summary": "Son of Peleg and father of Serug; lived 239 years following the dispersion from Babel.",
        "scriptures": ["Genesis 11:18-21", "Luke 3:35"]
    },
    "Serug": {
        "birthYear": -2207, "deathYear": -1977, "lifespan": 230, "era": "flood",
        "role": "Great-Grandfather of Abraham",
        "summary": "Son of Reu and father of Nahor, whose descendants settled in northern Mesopotamia.",
        "scriptures": ["Genesis 11:20-23", "Luke 3:35"]
    },
    "Nahor": {
        "birthYear": -2177, "deathYear": -2029, "lifespan": 148, "era": "flood",
        "role": "Grandfather of Abraham",
        "summary": "Son of Serug and father of Terah, living in the Mesopotamian region of Ur and Haran.",
        "scriptures": ["Genesis 11:22-25", "Luke 3:34"]
    },
    "Terah": {
        "birthYear": -2148, "deathYear": -1943, "lifespan": 205, "era": "patriarchs",
        "role": "Father of Abraham, Nahor & Haran",
        "summary": "Led his family out of Ur of the Chaldeans to Haran, where he died at age 205 in 1943 B.C.E. — the exact year Abraham crossed the Euphrates.",
        "scriptures": ["Genesis 11:24-32", "Acts 7:2-4"]
    },
    "Abraham": {
        "birthYear": -2018, "deathYear": -1843, "lifespan": 175, "era": "patriarchs",
        "role": "Friend of Jehovah & Father of All Having Faith",
        "summary": "Crossed the Euphrates in 1943 B.C.E., inaugurating the Abrahamic Covenant (Genesis 15:18; 22:18): through his offspring all nations of the earth would obtain a blessing.",
        "scriptures": ["Genesis 12:1-3", "Genesis 15:18", "Genesis 17:5", "Genesis 22:18", "Galatians 3:16-17"]
    },
    "Sarah": {
        "birthYear": -2008, "deathYear": -1881, "lifespan": 127, "era": "patriarchs",
        "role": "Matriarch & Mother of Isaac",
        "summary": "Faithful wife of Abraham whose name was changed from Sarai to Sarah ('Princess'). Miraculously bore Isaac at age 90 in fulfillment of God's promise.",
        "scriptures": ["Genesis 17:15-19", "Genesis 21:1-3", "Hebrews 11:11"]
    },
    "Ishmael": {
        "birthYear": -1932, "deathYear": -1795, "lifespan": 137, "era": "patriarchs",
        "role": "Firstborn Son of Abraham via Hagar",
        "summary": "Born when Abraham was 86. Though not the covenant heir, Jehovah blessed him to become a great nation of 12 chieftains across Arabia.",
        "scriptures": ["Genesis 16:15", "Genesis 17:20", "Genesis 25:12-18"]
    },
    "Isaac": {
        "birthYear": -1917, "deathYear": -1738, "lifespan": 180, "era": "patriarchs",
        "role": "Child of Promise & Heir of the Covenant",
        "summary": "Miraculously born to Abraham and Sarah. Jehovah reaffirmed the Abrahamic oath directly to Isaac (Genesis 26:3). Weaned in 1913 B.C.E., marking the start of the 400 years of affliction.",
        "scriptures": ["Genesis 21:1-8", "Genesis 22:1-14", "Genesis 26:3-4", "Genesis 35:28-29"]
    },
    "Rebekah": {
        "birthYear": None, "deathYear": None, "lifespan": None, "era": "patriarchs",
        "role": "Faithful Wife of Isaac & Mother of Twins",
        "summary": "Left her family in Mesopotamia to marry Isaac. Received Jehovah's prophecy that 'the older will serve the younger' regarding her twin sons Esau and Jacob.",
        "scriptures": ["Genesis 24:58-67", "Genesis 25:21-26"]
    },
    "Jacob/Israel": {
        "birthYear": -1858, "deathYear": -1711, "lifespan": 147, "era": "patriarchs",
        "role": "Patriarch Renamed Israel, Father of the 12 Tribes",
        "summary": "Inherited the birthright and Messianic covenant (Genesis 28:14). After wrestling an angel, God renamed him Israel (Genesis 32:28). His 12 sons formed the tribes of Israel; he settled in Egypt in 1728 B.C.E.",
        "scriptures": ["Genesis 28:13-15", "Genesis 32:28", "Genesis 49:10", "Genesis 47:28"]
    },
    "Leah": {
        "birthYear": None, "deathYear": None, "lifespan": None, "era": "patriarchs",
        "role": "First Wife of Jacob & Mother of Judah and Levi",
        "summary": "Mother of six of Israel's tribes — Reuben, Simeon, Levi, Judah, Issachar, and Zebulun — making her the direct matriarch of both the priestly line (Levi) and the Messianic royal line (Judah).",
        "scriptures": ["Genesis 29:31-35", "Genesis 30:17-21", "Ruth 4:11"]
    },
    "Joseph": {
        "birthYear": -1767, "deathYear": -1657, "lifespan": 110, "era": "tribes",
        "role": "Son of Jacob & Prime Minister of Egypt",
        "summary": "Sold into slavery in Egypt at 17, yet remained faithful and was elevated by Pharaoh to save his family from famine. Father of Ephraim and Manasseh, receiving the double portion.",
        "scriptures": ["Genesis 37:2-36", "Genesis 41:41-46", "Genesis 50:22-26"]
    },
    "Judah": {
        "birthYear": None, "deathYear": None, "lifespan": None, "era": "tribes",
        "role": "Fourth Son of Jacob & Royal Messianic Tribe",
        "summary": "Received Jacob's landmark deathbed prophecy (Genesis 49:10): 'The scepter will not depart from Judah... until Shiloh comes, and to him the obedience of the peoples will belong.'",
        "scriptures": ["Genesis 29:35", "Genesis 49:8-12", "Hebrews 7:14", "Revelation 5:5"]
    },
    "Tamar": {
        "birthYear": None, "deathYear": None, "lifespan": None, "era": "tribes",
        "role": "Mother of Twins Perez and Zerah",
        "summary": "One of the women specifically highlighted in Matthew's genealogy of Jesus (Matthew 1:3), preserving the line of Judah through her son Perez.",
        "scriptures": ["Genesis 38:6-30", "Ruth 4:12", "Matthew 1:3"]
    },
    "Perez": {
        "birthYear": None, "deathYear": None, "lifespan": None, "era": "tribes",
        "role": "Son of Judah & Ancestor of King David",
        "summary": "Twin son of Judah and Tamar whose house became the preeminent royal clan of Judah leading to Boaz, David, and Christ.",
        "scriptures": ["Genesis 38:29", "Ruth 4:18", "Matthew 1:3", "Luke 3:33"]
    },
    "Hezron": {
        "birthYear": None, "deathYear": None, "lifespan": None, "era": "tribes",
        "role": "Grandson of Judah Who Entered Egypt",
        "summary": "Son of Perez who accompanied Jacob's household down to Egypt in 1728 B.C.E. and founded the family of the Hezronites.",
        "scriptures": ["Genesis 46:12", "Ruth 4:18-19", "1 Chronicles 2:5"]
    },
    "Ram/Arni": {
        "birthYear": None, "deathYear": None, "lifespan": None, "era": "tribes",
        "role": "Son of Hezron in Egypt",
        "summary": "Direct ancestor of David listed as Ram in Ruth 4:19 and Matthew 1:3-4, and as Arni in Luke 3:33.",
        "scriptures": ["Ruth 4:19", "1 Chronicles 2:9", "Matthew 1:3-4", "Luke 3:33"]
    },
    "Amminadab": {
        "birthYear": None, "deathYear": None, "lifespan": None, "era": "tribes",
        "role": "Father of Nahshon & Father-in-Law of Aaron",
        "summary": "Key link in Judah's line during Israel's sojourn in Egypt; his daughter Elisheba married High Priest Aaron, uniting Judah and Levi in family ties.",
        "scriptures": ["Exodus 6:23", "Ruth 4:19-20", "Matthew 1:4"]
    },
    "Nahshon": {
        "birthYear": None, "deathYear": None, "lifespan": None, "era": "tribes",
        "role": "Chieftain of the Tribe of Judah at the Exodus",
        "summary": "Served as tribal chieftain of Judah in the wilderness under Moses and presented the very first offering at the inauguration of the tabernacle altar.",
        "scriptures": ["Numbers 1:7", "Numbers 7:12", "Ruth 4:20", "Matthew 1:4"]
    },
    "Moses": {
        "birthYear": -1593, "deathYear": -1473, "lifespan": 120, "era": "tribes",
        "role": "Mediator of the Law Covenant & Deliverer of Israel",
        "summary": "Levite descendant of Kohath and Amram. Led Israel out of Egypt in 1513 B.C.E., mediated the Mosaic Law at Mount Sinai, and foretold a greater Prophet to come (Deuteronomy 18:15-18).",
        "scriptures": ["Exodus 3:10-15", "Deuteronomy 18:15-18", "Deuteronomy 34:7"]
    },
    "Aaron": {
        "birthYear": -1597, "deathYear": -1474, "lifespan": 123, "era": "tribes",
        "role": "First High Priest of Israel",
        "summary": "Older brother of Moses from the tribe of Levi; installed as Israel's first High Priest, founding the Aaronic priesthood that foreshadowed Jesus' superior priesthood.",
        "scriptures": ["Exodus 28:1", "Numbers 33:38-39", "Hebrews 5:4"]
    },
    "Salma": {
        "birthYear": None, "deathYear": None, "lifespan": None, "era": "tribes",
        "role": "Son of Nahshon & Husband of Rahab",
        "summary": "Also called Salmon. Entered the Promised Land with Joshua, married faithful Rahab of Jericho, and fathered Boaz of Bethlehem.",
        "scriptures": ["Ruth 4:20-21", "1 Chronicles 2:11", "Matthew 1:4-5"]
    },
    "Rahab": {
        "birthYear": None, "deathYear": None, "lifespan": None, "era": "tribes",
        "role": "Woman of Faith from Jericho",
        "summary": "Protected the Israelite spies in Jericho out of faith in Jehovah, was spared with her household, and became a direct ancestress of King David and Jesus Christ.",
        "scriptures": ["Joshua 2:1-21", "Matthew 1:5", "Hebrews 11:31", "James 2:25"]
    },
    "Boaz": {
        "birthYear": None, "deathYear": None, "lifespan": None, "era": "tribes",
        "role": "Kinsman-Repurchaser of Bethlehem",
        "summary": "Righteous landowner of Bethlehem during the era of the Judges who lovingly acted as repurchaser for Naomi and Ruth, continuing the royal Messianic line.",
        "scriptures": ["Ruth 2:1-12", "Ruth 4:9-21", "Matthew 1:5"]
    },
    "Ruth": {
        "birthYear": None, "deathYear": None, "lifespan": None, "era": "tribes",
        "role": "Loyal Moabitess & Great-Grandmother of David",
        "summary": "Left Moab out of loyal love for Naomi and Jehovah ('Your people will be my people, and your God my God'). Married Boaz and became a cherished ancestress of the Messiah.",
        "scriptures": ["Ruth 1:16-17", "Ruth 4:13-17", "Matthew 1:5"]
    },
    "Obed": {
        "birthYear": None, "deathYear": None, "lifespan": None, "era": "tribes",
        "role": "Son of Boaz and Ruth & Grandfather of David",
        "summary": "Born in Bethlehem as the joyful heir to Naomi's family line, becoming the father of Jesse and grandfather of King David.",
        "scriptures": ["Ruth 4:17", "Ruth 4:21-22", "Matthew 1:5"]
    },
    "Jesse": {
        "birthYear": None, "deathYear": None, "lifespan": None, "era": "david",
        "role": "Father of King David — 'The Stump of Jesse'",
        "summary": "Bethlehemite grandson of Boaz and Ruth. Isaiah 11:1, 10 famously prophesied that the Messiah would arise as 'a twig out of the stump of Jesse' and 'the root of Jesse.'",
        "scriptures": ["1 Samuel 16:1-13", "Isaiah 11:1", "Isaiah 11:10", "Romans 15:12"]
    },
    "David": {
        "birthYear": -1107, "deathYear": -1037, "lifespan": 70, "era": "david",
        "role": "Shepherd-King of Israel & Recipient of the Kingdom Covenant",
        "summary": "Anointed by Samuel and reigned 40 years (1077–1037 B.C.E.). Jehovah made an everlasting Kingdom covenant with David (2 Samuel 7:12-16). Both Matthew 1 (via Solomon) and Luke 3 (via Nathan) trace Jesus directly to David.",
        "scriptures": ["2 Samuel 7:12-16", "Psalm 110:1-4", "Matthew 1:6", "Luke 1:32"]
    },
    "Bath-Sheba": {
        "birthYear": None, "deathYear": None, "lifespan": None, "era": "david",
        "role": "Mother of Both Solomon and Nathan",
        "summary": "Remarkably, Bath-sheba is the mother of BOTH Solomon (Matthew 1 legal royal line) and Nathan (Luke 3 natural bloodline), uniting both Messianic branches through her sons!",
        "scriptures": ["2 Samuel 12:24", "1 Chronicles 3:5", "Matthew 1:6", "Luke 3:31"]
    },
    "Solomon": {
        "birthYear": None, "deathYear": -998, "lifespan": None, "era": "david",
        "role": "Wise King of Israel & Builder of Jehovah's Temple",
        "summary": "Reigned 40 years (1037–998 B.C.E.) in golden peace, built the magnificent temple in Jerusalem, and anchors the Matthew 1 Legal Royal Lineage to Joseph.",
        "scriptures": ["1 Kings 3:5-14", "1 Kings 6:1", "Matthew 1:6-7"]
    },
    "Nathan": {
        "birthYear": None, "deathYear": None, "lifespan": None, "era": "david",
        "role": "Son of David & Head of Luke 3 Natural Lineage",
        "summary": "Third son born to David and Bath-sheba in Jerusalem. Through Nathan's quiet, non-reigning line, the natural bloodline of David descended unbroken to Mary, the mother of Jesus.",
        "scriptures": ["2 Samuel 5:14", "1 Chronicles 3:5", "Luke 3:31"]
    },
    "Rehoboam": {
        "birthYear": None, "deathYear": None, "lifespan": None, "era": "david",
        "role": "First King of the Southern Kingdom of Judah",
        "summary": "Son of Solomon; during his reign in 997 B.C.E., the ten northern tribes broke away, splitting Israel into two kingdoms for 390 years (Ezekiel 4:5).",
        "scriptures": ["1 Kings 12:1-20", "Matthew 1:7"]
    },
    "Hezekiah": {
        "birthYear": None, "deathYear": None, "lifespan": None, "era": "david",
        "role": "Faithful Reformer King of Judah",
        "summary": "Restored true temple worship, trusted Jehovah during Sennacherib's Assyrian siege (732 B.C.E.), and kept David's legal line alive.",
        "scriptures": ["2 Kings 18:1-7", "2 Kings 19:35", "Matthew 1:9-10"]
    },
    "Josiah": {
        "birthYear": None, "deathYear": -628, "lifespan": None, "era": "david",
        "role": "Young Reformer King Who Rediscovered the Law",
        "summary": "Became king at age 8, purged idolatry throughout Judah, and held a grand Passover after the Book of the Law was found in the temple.",
        "scriptures": ["2 Kings 22:1-2", "2 Kings 23:25", "Matthew 1:10-11"]
    },
    "Jehoiachin": {
        "birthYear": None, "deathYear": None, "lifespan": None, "era": "exile",
        "role": "Exiled King of Judah (Jeconiah / Coniah)",
        "summary": "Taken captive to Babylon in 617 B.C.E. Jeremiah 22:30 foretold none of his physical offspring would sit on David's throne — yet the legal right passed via Joseph while the physical descent came through Nathan and Mary!",
        "scriptures": ["2 Kings 24:8-15", "Jeremiah 22:30", "Matthew 1:11-12"]
    },
    "Shealtiel": {
        "birthYear": None, "deathYear": None, "lifespan": None, "era": "exile",
        "role": "Convergence Link in Exile (Matthew 1 & Luke 3)",
        "summary": "Listed as son of Jeconiah (Matthew 1:12) and son of Neri (Luke 3:27), likely through marriage to Neri's daughter or levirate succession, forming a bridge between the royal and Nathan lines.",
        "scriptures": ["1 Chronicles 3:17", "Ezra 3:2", "Matthew 1:12", "Luke 3:27"]
    },
    "Zerubbabel": {
        "birthYear": None, "deathYear": None, "lifespan": None, "era": "exile",
        "role": "Governor of Returned Exiles & Temple Rebuilder",
        "summary": "Led the Jewish exiles back from Babylon in 537 B.C.E. and laid the foundation of the rebuilt temple in Jerusalem. Appears in both Matthew 1:12-13 and Luke 3:27!",
        "scriptures": ["Ezra 2:2", "Ezra 3:8", "Haggai 2:23", "Matthew 1:12-13", "Luke 3:27"]
    },
    "Heli": {
        "birthYear": None, "deathYear": None, "lifespan": None, "era": "offspring",
        "role": "Father of Mary (Luke 3:23)",
        "summary": "Direct descendant of David through Nathan and maternal grandfather of Jesus; Joseph is called 'son of Heli' in Luke 3:23 as Heli's son-in-law.",
        "scriptures": ["Luke 3:23"]
    },
    "Mary": {
        "birthYear": None, "deathYear": None, "lifespan": None, "era": "offspring",
        "role": "Mother of Jesus & Heir of Nathan's Bloodline",
        "summary": "Humble young woman of Nazareth from David's house via Nathan (Luke 3). Angel Gabriel announced to her (Luke 1:32) that her son Jesus would inherit the throne of David forever.",
        "scriptures": ["Luke 1:26-38", "Luke 2:4-7", "Luke 3:23-38"]
    },
    "Joseph (Legal Father)": {
        "birthYear": None, "deathYear": None, "lifespan": None, "era": "offspring",
        "role": "Adoptive Father of Jesus & Legal Heir of David's Throne",
        "summary": "Righteous carpenter of Nazareth descended from King Solomon (Matthew 1:1-16). By adopting Jesus as his legal son, Joseph conferred the indisputable legal right to David's throne upon Jesus.",
        "scriptures": ["Matthew 1:16-25", "Matthew 2:13-23", "Luke 2:4"]
    },
    "Jesus": {
        "birthYear": -2, "deathYear": 33, "lifespan": 33, "era": "offspring",
        "role": "The Promised Offspring & Messiah",
        "summary": "Born in Bethlehem in 2 B.C.E. to Mary (Luke 3 natural descent from David via Nathan) and adopted by Joseph (Matthew 1 legal right via Solomon). Baptized in the fall of 29 C.E., precisely fulfilling Daniel's 69 weeks (455 B.C.E. → 29 C.E.) and becoming the Promised Offspring of Genesis 3:15.",
        "scriptures": ["Genesis 3:15", "Daniel 9:24-25", "Matthew 1:1-17", "Luke 1:32-33", "Luke 3:21-38", "Galatians 3:16"]
    },
    "Samuel": {
        "birthYear": None, "deathYear": None, "lifespan": None, "era": "tribes",
        "role": "Last Judge & Prophet Who Anointed David",
        "summary": "Faithful Levite prophet who judged Israel, anointed Saul as first king in 1117 B.C.E., and later anointed young David of Bethlehem.",
        "scriptures": ["1 Samuel 3:19-20", "1 Samuel 16:12-13"]
    },
    "Saul": {
        "birthYear": None, "deathYear": -1078, "lifespan": None, "era": "david",
        "role": "First King of Israel (Tribe of Benjamin)",
        "summary": "Began ruling in 1117 B.C.E., ending the 356-year period of the Judges. Reigned 40 years before David succeeded him.",
        "scriptures": ["1 Samuel 10:1", "Acts 13:21"]
    },
    "Esther": {
        "birthYear": None, "deathYear": None, "lifespan": None, "era": "exile",
        "role": "Courageous Queen Who Saved the Jewish Nation",
        "summary": "Benjamite orphan raised by Mordecai who risked her life in ~483 B.C.E. to thwart Haman's plot — preserving the Jewish people and the Messianic line!",
        "scriptures": ["Esther 4:14", "Esther 7:3-6", "Esther 8:11"]
    },
    "Mordecai": {
        "birthYear": None, "deathYear": None, "lifespan": None, "era": "exile",
        "role": "Faithful Guardian of Esther & Prime Minister of Persia",
        "summary": "Benjamite descendant of Kish who guided Queen Esther to save the nation of Israel in 483 B.C.E.",
        "scriptures": ["Esther 2:5-7", "Esther 10:3"]
    },
    "John the Baptizer": {
        "birthYear": -2, "deathYear": 32, "lifespan": 33, "era": "offspring",
        "role": "Forerunner Who Baptized Jesus in 29 C.E.",
        "summary": "Son of Levite priest Zechariah and Elizabeth (relative of Mary). Prepared the way for the Messiah and baptized Jesus in the Jordan River in the fall of 29 C.E.",
        "scriptures": ["Luke 1:5-17", "Matthew 3:13-17", "John 1:29"]
    },
}

# Exact PDF index assignments for the Direct Messianic Line
# (Verified from bounding boxes in /tmp/pdf_inspect/links.json)
SPINE_SEQUENCE = [
    ("Adam", 619),
    ("Seth", 657),
    ("Enosh", 658),
    ("Kenan", 659),
    ("Mahalalel", 674),
    ("Jared", 677),
    ("Enoch", 678),
    ("Methuselah", 675),
    ("Lamech", 660),
    ("Noah", 661),
    ("Shem", 662),
    ("Arpachshad", 676),
    ("Shelah", 663),
    ("Eber", 664),
    ("Peleg", 673),
    ("Reu", 665),
    ("Serug", 672),
    ("Nahor", 666),
    ("Terah", 667),
    ("Abraham", 671),
    ("Isaac", 668),
    ("Jacob/Israel", 670),
    ("Judah", 736),
    ("Perez", 740),
    ("Hezron", 741),
    ("Ram/Arni", 742),
    ("Amminadab", 748),
    ("Nahshon", 743),
    ("Salma", 744),
    ("Boaz", 747),
    ("Obed", 745),
    ("Jesse", 746),
    ("David", 669),
]

# Key Messianic mothers/matriarchs on the spine
SPINE_MOTHERS = {
    618: ("Eve", 619),            # spouse of Adam
    51: ("Sarah", 671),           # spouse of Abraham
    682: ("Rebekah", 668),        # spouse of Isaac
    680: ("Leah", 670),           # spouse of Jacob
    656: ("Tamar", 736),          # union with Judah
    436: ("Rahab", 744),          # spouse of Salma
    439: ("Ruth", 747),           # spouse of Boaz
    681: ("Bath-Sheba", 669),     # spouse of David
}

# Matthew 1 Legal Lineage (Solomon -> Zerubbabel -> Joseph -> Jesus)
MATTHEW1_SEQUENCE = [
    739,  # Solomon
    370,  # Rehoboam
    371,  # Abijah
    372,  # Asa
    373,  # Jehoshaphat
    374,  # Jehoram
    375,  # Ahaziah
    376,  # Jehoash
    377,  # Amaziah
    378,  # Uzziah
    379,  # Jotham
    380,  # Ahaz
    381,  # Hezekiah
    382,  # Manasseh
    383,  # Amon
    389,  # Josiah
    390,  # Jehoiakim
    393,  # Jehoiachin (central line)
    395,  # Shealtiel
    738,  # Zerubbabel
    316,  # Abiud
    359,  # Eliakim
    367,  # Azor
    369,  # Zadok
    368,  # Achim
    365,  # Eliud
    366,  # Eleazar
    364,  # Matthan
    360,  # Jacob
    445,  # Joseph
]

# Luke 3 Natural Lineage (Nathan -> Neri -> Shealtiel -> Zerubbabel -> Rhesa -> ... -> Heli -> Mary -> Jesus)
LUKE3_PRE_ZERUBBABEL = [
    737,  # Nathan
    297,  # Mattatha
    298,  # Menna
    299,  # Melea
    300,  # Eliakim
    301,  # Jonam
    302,  # Joseph
    303,  # Judas
    304,  # Symeon
    305,  # Levi
    306,  # Matthat
    307,  # Jorim
    308,  # Eliezer
    309,  # Jesus (son of Eliezer)
    310,  # Er
    311,  # Elmadam
    312,  # Cosam
    313,  # Addi
    314,  # Melchi
    315,  # Neri
]

LUKE3_POST_ZERUBBABEL = [
    318,  # Rhesa
    319,  # Joanan
    320,  # Joda
    321,  # Josech
    322,  # Semein
    327,  # Mattathias
    326,  # Maath
    325,  # Naggai
    324,  # Esli
    323,  # Nahum
    328,  # Amos
    329,  # Mattathias
    330,  # Joseph
    331,  # Jannai
    332,  # Melchi
    358,  # Levi
    357,  # Matthat
    333,  # Heli
    444,  # Mary
]

JESUS_IDX = 684

# Judges & Priests highlight indices
JUDGE_PRIEST_INDICES = {
    146,  # Samuel
    147,  # Moses
    148,  # Aaron
    250,  # Miriam
    149,  # John the Baptizer
    200,  # Elizabeth
    218,  # Zechariah
    181, 182, 184, 187, 188,  # Nadab, Abihu, Eleazar, Phinehas
    721,  # Joshua
    722,  # Caleb
    724, 725, 726, 727, 728, 729, 730, 731, 732, 733, 734, 735,  # All 12 Judges badges
}


def normalize_text(raw: str) -> str:
    """Normalize ligatures, collapse whitespace, deduplicate doubled drop-shadow labels, and fix PDF typos."""
    s = raw.strip()
    for k, v in LIGATURE_MAP.items():
        s = s.replace(k, v)
    s = re.sub(r"\s+", " ", s).strip()

    # Deduplicate exact doubled labels (e.g. "Seth Seth" -> "Seth", "Jacob/Israel Jacob/Israel" -> "Jacob/Israel")
    parts = s.split(" ")
    if len(parts) % 2 == 0 and len(parts) >= 2:
        half = len(parts) // 2
        if parts[:half] == parts[half:]:
            s = " ".join(parts[:half])

    # Strip trailing punctuation on city/place names (e.g. "Babel," -> "Babel", "Assyria." -> "Assyria")
    if s.endswith((",", ".")) and not s.endswith("3:27)."):
        s = s.rstrip(",.").strip()

    # Apply targeted label fixes
    if s in LABEL_FIXES:
        s = LABEL_FIXES[s]

    return s


def match_banner(rect: pymupdf.Rect):
    """Match an empty-text annotation bounding box against known rasterized banner coordinates."""
    cx = (rect.x0 + rect.x1) / 2.0
    cy = (rect.y0 + rect.y1) / 2.0
    for bx0, by0, bx1, by1, label, btype in BANNER_COORDS:
        bcx = (bx0 + bx1) / 2.0
        bcy = (by0 + by1) / 2.0
        if abs(cx - bcx) < 12.0 and abs(cy - bcy) < 12.0:
            return label, btype
    return None, None


def infer_era(x: float, y: float, categories: list) -> str:
    if "prophecies" in categories:
        return "prophecies"
    if y < 395:
        return "eden"
    if y < 780:
        return "flood"
    if y < 1340:
        return "patriarchs"
    if y < 1740:
        return "tribes"
    if y < 2195:
        return "david"
    if y < 2395:
        return "exile"
    return "offspring"


def extract_all(pdf_path: str, out_dir: Path):
    doc = pymupdf.open(pdf_path)
    page = doc[0]
    page_w, page_h = round(page.rect.width, 2), round(page.rect.height, 2)
    raw_links = [l for l in page.get_links() if "uri" in l]
    words = page.get_text("words")

    # Identify stray/wrapped fragments to merge cleanly:
    # - idx 652 is a 2.28pt stray sliver of Rehoboth-Ir (idx 696, identical docid=1200003682)
    # - idx 420 ("of Machir") is second wrapped line of idx 419 ("Daughter", identical bible=13002021)
    # - idx 412 ("(Chileab)") is second wrapped line of idx 411 ("Daniel", identical docid=1200001117&par=3)
    SKIP_INDICES = {652, 420, 412}

    nodes = []
    idx_to_id = {}

    spine_idx_set = {idx for _, idx in SPINE_SEQUENCE}
    matthew1_set = set(MATTHEW1_SEQUENCE)
    luke3_set = set(LUKE3_PRE_ZERUBBABEL) | set(LUKE3_POST_ZERUBBABEL)
    shared_post_exile = {395, 738}  # Shealtiel & Zerubbabel sit in both Matthew 1 & Luke 3!

    for idx, l in enumerate(raw_links):
        if idx in SKIP_INDICES:
            continue

        r = pymupdf.Rect(l["from"])
        uri = l["uri"].strip()

        # Repair the one corrupted PDF link (idx 404: Jonathan, nephew of King David, 2Sa 21:20-21)
        if not uri.startswith("https://www.jw.org/finder"):
            if idx == 404:
                uri = "https://www.jw.org/finder?srcid=jwlshare&wtlocale=E&prefer=lang&docid=1200002506&par=6"
            else:
                raise ValueError(f"Unexpected non-jw.org URL at idx {idx}: {uri}")

        # Expand merged multi-line rects slightly
        if idx == 419:
            r = r | pymupdf.Rect(raw_links[420]["from"])
        elif idx == 411:
            r = r | pymupdf.Rect(raw_links[412]["from"])

        # Extract words intersecting annotation rect
        hits = []
        for w in words:
            wr = pymupdf.Rect(w[:4])
            inter = r & wr
            if not inter.is_empty and (
                inter.get_area() / max(wr.get_area(), 1e-6) > 0.30
                or inter.get_area() / max(r.get_area(), 1e-6) > 0.30
            ):
                hits.append(w)
        hits.sort(key=lambda w: (round(w[1], 1), w[0]))
        raw_text = " ".join(w[4] for w in hits).strip()

        banner_type = None
        if not raw_text:
            label, banner_type = match_banner(r)
            if not label:
                raise ValueError(f"Unmapped empty-text link at idx={idx}, rect={r}, uri={uri}")
        else:
            label = normalize_text(raw_text)
            if idx == 411:
                label = "Daniel (Chileab)"
            elif idx == 419:
                label = "Daughter of Machir"

        assert label, f"Empty label at idx={idx}"

        cx = round((r.x0 + r.x1) / 2.0, 2)
        cy = round((r.y0 + r.y1) / 2.0, 2)

        # Determine categories & Messianic branch
        categories = []
        branch = "none"
        is_messianic = False

        if idx in spine_idx_set or idx in SPINE_MOTHERS or idx == JESUS_IDX:
            is_messianic = True
            branch = "spine"
            categories.append("line-to-jesus")
        if idx in shared_post_exile:
            is_messianic = True
            branch = "both"
            if "line-to-jesus" not in categories:
                categories.append("line-to-jesus")
        elif idx in matthew1_set:
            is_messianic = True
            branch = "matthew1"
            if "line-to-jesus" not in categories:
                categories.append("line-to-jesus")
        elif idx in luke3_set:
            is_messianic = True
            branch = "luke3"
            if "line-to-jesus" not in categories:
                categories.append("line-to-jesus")

        # Prophecies & scripture annotations
        if (
            (1360 <= r.x0 <= 1670 and r.y0 < 380)
            or idx in {621, 635, 636, 638, 644, 679}
        ):
            categories.append("prophecies")

        # Origin of Nations (badges, Nimrod's cities, post-Flood nations y=405..740 outside central spine, plus Moab/Ammon/Arabs/Edomites)
        if (
            banner_type == "nation"
            or idx in {646, 647, 648, 649, 650, 651, 696, 653, 654, 655, 637, 639, 640, 641, 642, 643, 679}
            or (440 <= r.y0 <= 740 and not is_messianic and not (1360 <= r.x0 and r.y0 < 380))
        ):
            categories.append("origin-of-nations")

        # 12 Tribes (13 tribe banners + tribal trees below y=1360)
        if banner_type == "tribe":
            categories.append("tribes")
        elif r.y0 >= 1350 and not is_messianic and "prophecies" not in categories and "origin-of-nations" not in categories:
            # Check if Judges & Priests (Levi column x=400..710 or judge badges)
            if idx in JUDGE_PRIEST_INDICES or (390 <= cx <= 705 and 1400 <= cy <= 2490):
                categories.append("judges-priests")
                categories.append("tribes")
            else:
                categories.append("tribes")

        # Patriarchs (top pre-Flood & Abraham/Isaac/Jacob/Esau/Ishmael/Lot/Laban eras)
        if r.y0 < 1350 and "prophecies" not in categories and banner_type != "nation":
            if "origin-of-nations" not in categories or is_messianic:
                categories.append("patriarchs")

        if idx in JUDGE_PRIEST_INDICES and "judges-priests" not in categories:
            categories.append("judges-priests")

        if not categories:
            categories.append("tribes")

        primary_category = categories[0]
        era = infer_era(cx, cy, categories)

        # Look up curated profile (disambiguate Joseph the Patriarch vs Joseph legal father vs Luke 3 Josephs)
        profile = None
        if idx == 445:
            profile = CURATED_PROFILES["Joseph (Legal Father)"]
        elif idx == 446 or (label == "Joseph" and cy < 1350):
            profile = CURATED_PROFILES["Joseph"]
        elif idx == 684:
            profile = CURATED_PROFILES["Jesus"]
        elif idx in {147, 148, 146, 567, 568, 260, 149}:
            profile = CURATED_PROFILES.get(label)
        elif is_messianic and idx not in {302, 330, 309, 360, 334, 358, 305, 371, 382}:
            profile = CURATED_PROFILES.get(label)
        elif label == "Ishmael" and cy < 1000:
            profile = CURATED_PROFILES["Ishmael"]

        node_id = f"n{idx}"
        idx_to_id[idx] = node_id

        # Build clean role/summary defaults if not curated
        default_role = {
            "line-to-jesus": (
                "Matthew 1 Legal Lineage to Jesus" if branch == "matthew1"
                else "Luke 3 Natural Lineage to Jesus" if branch == "luke3"
                else "Direct Messianic Ancestor"
            ),
            "origin-of-nations": "Ancient Nation / Post-Flood Lineage",
            "patriarchs": "Patriarchal Era Figure",
            "tribes": "Tribe of Israel" if banner_type == "tribe" else "Tribal Descendant of Israel",
            "judges-priests": "Judge, Priest, or Deliverer in Israel",
            "prophecies": "Messianic Prophecy / Scriptural Milestone",
        }.get(primary_category, "Biblical Figure")

        default_summary = (
            f"{label} appears on The Promised Offspring genealogical chart within the {default_role.lower()} section. "
            f"Open the linked JW Library / Insight article below for the complete scriptural background and historical details."
        )

        node = {
            "id": node_id,
            "pdfIdx": idx,
            "name": label,
            "category": primary_category,
            "categories": categories,
            "branch": branch,
            "isMessianic": is_messianic,
            "isBanner": banner_type is not None,
            "bannerType": banner_type,
            "era": profile["era"] if profile else era,
            "x": round(r.x0, 2),
            "y": round(r.y0, 2),
            "w": round(r.width, 2),
            "h": round(r.height, 2),
            "cx": cx,
            "cy": cy,
            "jwUrl": uri,
            "birthYear": profile["birthYear"] if profile else None,
            "deathYear": profile["deathYear"] if profile else None,
            "lifespan": profile["lifespan"] if profile else None,
            "role": profile["role"] if profile else default_role,
            "summary": profile["summary"] if profile else default_summary,
            "scriptures": profile["scriptures"] if profile else [],
            "parents": [],
            "spouses": [],
            "children": [],
        }
        nodes.append(node)

    # Index nodes by id for relationship wiring
    node_by_id = {n["id"]: n for n in nodes}
    edges = []
    edge_keys = set()

    def add_edge(src_idx, dst_idx, etype, wire_family=True):
        if src_idx not in idx_to_id or dst_idx not in idx_to_id:
            return
        sid, did = idx_to_id[src_idx], idx_to_id[dst_idx]
        if sid == did:
            return
        key = (sid, did, etype)
        if key in edge_keys:
            return
        edge_keys.add(key)
        edges.append({"from": sid, "to": did, "type": etype})
        if wire_family:
            if etype == "marriage":
                if did not in node_by_id[sid]["spouses"]:
                    node_by_id[sid]["spouses"].append(did)
                if sid not in node_by_id[did]["spouses"]:
                    node_by_id[did]["spouses"].append(sid)
            else:
                if did not in node_by_id[sid]["children"]:
                    node_by_id[sid]["children"].append(did)
                if sid not in node_by_id[did]["parents"]:
                    node_by_id[did]["parents"].append(sid)

    # 1. Wire Spine Messianic Line (Adam -> David)
    for i in range(len(SPINE_SEQUENCE) - 1):
        add_edge(SPINE_SEQUENCE[i][1], SPINE_SEQUENCE[i + 1][1], "messianic")

    # Wire Spine Mothers & Marriages
    for m_idx, (_, spouse_idx) in SPINE_MOTHERS.items():
        add_edge(spouse_idx, m_idx, "marriage")
    # Connect mothers directly to their Messianic child
    mother_child_pairs = [
        (618, 657),  # Eve -> Seth
        (51, 668),   # Sarah -> Isaac
        (682, 670),  # Rebekah -> Jacob
        (680, 736),  # Leah -> Judah
        (656, 740),  # Tamar -> Perez
        (436, 747),  # Rahab -> Boaz
        (439, 745),  # Ruth -> Obed
        (681, 739),  # Bath-Sheba -> Solomon
        (681, 737),  # Bath-Sheba -> Nathan
    ]
    for m_idx, c_idx in mother_child_pairs:
        add_edge(m_idx, c_idx, "maternal")

    # 2. Wire Matthew 1 Legal Lineage (David -> Solomon -> ... -> Zerubbabel -> ... -> Joseph -> Jesus)
    add_edge(669, MATTHEW1_SEQUENCE[0], "matthew1")
    for i in range(len(MATTHEW1_SEQUENCE) - 1):
        add_edge(MATTHEW1_SEQUENCE[i], MATTHEW1_SEQUENCE[i + 1], "matthew1")
    add_edge(445, JESUS_IDX, "matthew1")  # Joseph -> Jesus (legal)

    # 3. Wire Luke 3 Natural Lineage (David -> Nathan -> ... -> Neri -> Shealtiel -> Zerubbabel -> Rhesa -> ... -> Heli -> Mary -> Jesus)
    add_edge(669, LUKE3_PRE_ZERUBBABEL[0], "luke3")
    for i in range(len(LUKE3_PRE_ZERUBBABEL) - 1):
        add_edge(LUKE3_PRE_ZERUBBABEL[i], LUKE3_PRE_ZERUBBABEL[i + 1], "luke3")
    add_edge(315, 395, "luke3")  # Neri -> Shealtiel (Luke 3:27)
    add_edge(395, 738, "luke3")  # Shealtiel -> Zerubbabel
    add_edge(738, LUKE3_POST_ZERUBBABEL[0], "luke3")  # Zerubbabel -> Rhesa
    for i in range(len(LUKE3_POST_ZERUBBABEL) - 1):
        add_edge(LUKE3_POST_ZERUBBABEL[i], LUKE3_POST_ZERUBBABEL[i + 1], "luke3")
    add_edge(444, JESUS_IDX, "luke3")  # Mary -> Jesus (natural)
    add_edge(444, 445, "marriage")     # Mary <-> Joseph

    # 4. Wire Major Key Branches (Cain/Abel, Noah's sons, Origin of Nations, 12 Tribes, Moses/Aaron, Saul/Esther, John the Baptizer)
    def find_idx(name, y_min=0, y_max=3000, x_min=0, x_max=2000):
        for n in nodes:
            if n["name"].lower() == name.lower() and y_min <= n["cy"] <= y_max and x_min <= n["cx"] <= x_max:
                return n["pdfIdx"]
        return None

    # Adam/Eve -> Cain, Abel
    for nm in ["Cain", "Abel"]:
        ci = find_idx(nm, 200, 270)
        if ci:
            add_edge(619, ci, "paternal")
            add_edge(618, ci, "maternal")

    # Noah -> Ham, Japheth
    ham_idx = find_idx("Ham", 390, 440)
    japheth_idx = find_idx("Japheth", 390, 440)
    if ham_idx:
        add_edge(661, ham_idx, "paternal")
    if japheth_idx:
        add_edge(661, japheth_idx, "paternal")

    # Sons of Ham, Shem, Japheth -> Nations badges
    ham_sons = [("Cush", "Cushites"), ("Mizraim", "Egyptians"), ("Put", "Libyans"), ("Canaan", "Canaanites")]
    for son, nation in ham_sons:
        si = find_idx(son, 440, 490)
        ni = find_idx(nation, 460, 730)
        if ham_idx and si:
            add_edge(ham_idx, si, "paternal")
        if si and ni:
            add_edge(si, ni, "nation")

    shem_sons = [("Elam", "Elamites"), ("Asshur", "Assyrians"), ("Lud", "Lydians"), ("Aram", "Syria")]
    for son, nation in shem_sons:
        si = find_idx(son, 440, 490)
        ni = find_idx(nation, 460, 600)
        if si:
            add_edge(662, si, "paternal")
        if si and ni:
            add_edge(si, ni, "nation")

    hebrews_idx = find_idx("Hebrews", 530, 580)
    if hebrews_idx:
        add_edge(664, hebrews_idx, "nation")  # Eber -> Hebrews

    joktan_idx = find_idx("Joktan", 560, 620)
    arabs_j_idx = find_idx("Arabs (Joktan)", 700, 760)
    if joktan_idx:
        add_edge(664, joktan_idx, "paternal")
        if arabs_j_idx:
            add_edge(joktan_idx, arabs_j_idx, "nation")

    japheth_sons = [
        ("Gomer", "Cimmerians"), ("Magog", "Scythians"), ("Madai", "Medes"),
        ("Javan", "Greeks"), ("Tubal", "Georgians"), ("Meshech", "Phrygians"), ("Tiras", "Thracians")
    ]
    for son, nation in japheth_sons:
        si = find_idx(son, 440, 490)
        ni = find_idx(nation, 460, 580)
        if japheth_idx and si:
            add_edge(japheth_idx, si, "paternal")
        if si and ni:
            add_edge(si, ni, "nation")

    # Abraham -> Ishmael -> Arabs (Ishmael); Isaac -> Esau -> Edomites
    ishmael_idx = find_idx("Ishmael", 900, 960)
    arabs_i_idx = find_idx("Arabs (Ishmael)", 1020, 1080)
    if ishmael_idx:
        add_edge(671, ishmael_idx, "paternal")
        if arabs_i_idx:
            add_edge(ishmael_idx, arabs_i_idx, "nation")

    esau_idx = find_idx("Esau", 1050, 1130)
    edom_idx = find_idx("Edomites", 1260, 1330)
    if esau_idx:
        add_edge(668, esau_idx, "paternal")
        if edom_idx:
            add_edge(esau_idx, edom_idx, "nation")

    # Jacob -> Wives (Rachel, Zilpah, Bilhah) & All 13 Tribes
    rachel_idx = find_idx("Rachel", 1170, 1240)
    zilpah_idx = find_idx("Zilpah", 1170, 1240)
    bilhah_idx = find_idx("Bilhah", 1170, 1240)
    joseph_pat_idx = find_idx("Joseph", 1250, 1340, 100, 220)

    for w_idx in [rachel_idx, zilpah_idx, bilhah_idx]:
        if w_idx:
            add_edge(670, w_idx, "marriage")

    # Wire Jacob + mothers -> 12 sons / 13 tribe banners
    tribe_mothers = [
        (693, 680),  # Reuben -> Leah
        (694, 680),  # Simeon -> Leah
        (683, 680),  # Levi -> Leah
        (691, 680),  # Zebulun -> Leah
        (692, 680),  # Issachar -> Leah
        (688, zilpah_idx),  # Asher -> Zilpah
        (687, zilpah_idx),  # Gad -> Zilpah
        (686, bilhah_idx),  # Naphtali -> Bilhah
        (685, bilhah_idx),  # Dan -> Bilhah
        (695, rachel_idx),  # Benjamin -> Rachel
    ]
    for t_idx, m_idx in tribe_mothers:
        add_edge(670, t_idx, "tribe")
        if m_idx:
            add_edge(m_idx, t_idx, "maternal")
    if joseph_pat_idx:
        add_edge(670, joseph_pat_idx, "tribe")
        if rachel_idx:
            add_edge(rachel_idx, joseph_pat_idx, "maternal")
        add_edge(joseph_pat_idx, 689, "tribe")  # Joseph -> Manasseh
        add_edge(joseph_pat_idx, 690, "tribe")  # Joseph -> Ephraim

    # Key Tribal Highlights (Levi -> Moses/Aaron/Miriam & Samuel & John the Baptizer; Benjamin -> Saul -> Jonathan & Esther/Mordecai; Ephraim -> Joshua)
    for ci in [147, 148, 250, 146]:
        add_edge(683, ci, "tribe", wire_family=False)
    add_edge(690, 721, "tribe", wire_family=False)  # Ephraim -> Joshua
    add_edge(695, 567, "tribe", wire_family=False)  # Benjamin -> Saul
    add_edge(567, 569, "paternal")                  # Saul -> Jonathan
    add_edge(695, 568, "tribe", wire_family=False)  # Benjamin -> Esther
    add_edge(695, 260, "tribe", wire_family=False)  # Benjamin -> Mordecai
    add_edge(218, 200, "marriage")                  # Zechariah <-> Elizabeth
    add_edge(218, 149, "paternal")                  # Zechariah -> John the Baptizer
    add_edge(200, 149, "maternal")                  # Elizabeth -> John the Baptizer

    # Assign lineageOrder for direct Messianic stepping stones
    order_counter = 1
    for _, idx in SPINE_SEQUENCE:
        node_by_id[idx_to_id[idx]]["lineageOrder"] = order_counter
        order_counter += 1
    node_by_id[idx_to_id[JESUS_IDX]]["lineageOrder"] = 100

    # --- BUILD PROPHECIES DATASET (13 milestones from PDF top-right) ---
    PROPHECY_META = [
        (622, "Genesis 3:15", "The Promise of Eden", "4026 B.C.E.", "eden",
         "Jehovah's foundational Messianic prophecy spoken in Eden: the woman's offspring will permanently crush the serpent's head after suffering a temporary wound in the heel.",
         "Fulfilled in Jesus Christ, who was struck in the heel through his death in 33 C.E. and resurrected to crush Satan.", [619, 618, 684]),
        (623, "Genesis 15:18", "Covenant with Abram", "1943 B.C.E.", "patriarchs",
         "Jehovah formalized his covenant with Abram, promising his offspring the land from the river of Egypt to the Euphrates.",
         "Established the legal territorial and spiritual inheritance for Abraham's descendants.", [671]),
        (624, "Genesis 17:5", "Abraham Given a New Name", "1919 B.C.E.", "patriarchs",
         "God renamed Abram ('Father Is High') to Abraham ('Father of a Crowd / Multitude'), declaring he would become the father of many nations.",
         "Broadened the scope of God's promise beyond one household to encompass faithful people of all nations.", [671, 51]),
        (625, "Genesis 22:18", "All Nations to Be Blessed", "c. 1893 B.C.E.", "patriarchs",
         "After Abraham's extraordinary faith in offering Isaac, Jehovah swore by himself that through Abraham's offspring all nations of the earth would obtain a blessing.",
         "Paul confirms at Galatians 3:16 that this promised 'offspring' is primarily Christ.", [671, 668, 684]),
        (626, "Genesis 26:3", "Promise to Isaac", "c. 1843 B.C.E.", "patriarchs",
         "Jehovah confirmed the Abrahamic oath specifically through Isaac rather than Ishmael, narrowing the Messianic channel.",
         "Verified that the covenant promise followed the miraculous line of Sarah's son Isaac.", [668, 682]),
        (627, "Genesis 28:14", "Promise to Jacob", "1781 B.C.E.", "patriarchs",
         "In a dream at Bethel featuring angels ascending and descending to heaven, Jehovah confirmed to Jacob that all families of the ground would be blessed through his offspring.",
         "Confirmed Jacob (not Esau) as the chosen third patriarch of the Messianic promise.", [670, 680]),
        (628, "Genesis 32:28", "Jacob Renamed to Israel", "1761 B.C.E.", "patriarchs",
         "After persevering all night wrestling an angel at the Jabbok, Jacob was renamed Israel ('Contender With God'), naming the covenant nation.",
         "Established the twelve tribes of Israel through which God's purpose would unfold.", [670, 736]),
        (629, "Genesis 49:10", "The Tribe of Judah", "1711 B.C.E.", "tribes",
         "On his deathbed in Egypt, Jacob prophesied that the royal scepter would belong to Judah until 'Shiloh' ('He Whose It Is') arrives.",
         "Narrowed the Messianic search from twelve tribes down to the single royal tribe of Judah.", [670, 736, 684]),
        (630, "2 Samuel 7:12", "The House of David", "c. 1070 B.C.E.", "david",
         "Through the prophet Nathan, Jehovah promised King David an everlasting dynasty: his royal house and throne would stand firm forever.",
         "Narrowed the Messiah's identity within Judah to a direct descendant of King David.", [669, 739, 737, 684]),
        (631, "Psalm 110:4", "To the Manner of Melchizedek", "c. 1070 B.C.E.", "david",
         "Jehovah swore that David's Lord would serve not only as King from Judah, but also as an eternal Priest 'in the manner of Melchizedek.'",
         "Explains how Jesus from Judah holds a superior, permanent royal priesthood surpassing the Aaronic line.", [669, 684]),
        (632, "Isaiah 11:10", "Out of the Stump of Jesse", "c. 732 B.C.E.", "david",
         "Even after the royal Davidic tree would be cut down in Babylonian exile, 'the root of Jesse' would stand as a signal for the peoples and nations.",
         "Foretold the Messiah's emergence from David's humble ancestral line in Bethlehem after centuries without a reigning king.", [746, 669, 684]),
        (633, "Daniel 9:24", "Messiah to Arrive in 69 'Weeks'", "539 B.C.E.", "exile",
         "Angel Gabriel revealed the 70-weeks prophecy: 69 prophetic weeks (483 years) from the word to rebuild Jerusalem (455 B.C.E.) would pinpoint the exact year Messiah the Leader would appear — 29 C.E.!",
         "Pinpointed Jesus' baptism and anointing in the fall of 29 C.E. to the exact year.", [738, 684]),
        (634, "Luke 1:32", "Jesus to Inherit Throne of David", "2 B.C.E.", "offspring",
         "Angel Gabriel declared to Mary in Nazareth: 'Jehovah God will give him the throne of David his father, and he will rule as King over the house of Jacob forever.'",
         "Directly united the Genesis 3:15, Judah, and Davidic promises in Jesus of Nazareth.", [444, 445, 684]),
    ]

    prophecies = []
    for order, (pidx, ref, title, date_label, era, summary, fulfillment, linked_idxs) in enumerate(PROPHECY_META, start=1):
        pnode = node_by_id[idx_to_id[pidx]]
        prophecies.append({
            "id": f"p{order}",
            "order": order,
            "nodeId": pnode["id"],
            "reference": ref,
            "title": title,
            "date": date_label,
            "era": era,
            "summary": summary,
            "fulfillment": fulfillment,
            "jwUrl": pnode["jwUrl"],
            "linkedNodeIds": [idx_to_id[i] for i in linked_idxs if i in idx_to_id],
        })

    # --- BUILD 27 DATED LIFESPANS DATASET (Adam 4026 B.C.E. -> Jesus 33 C.E.) ---
    # Note: Negative numbers represent B.C.E., positive represent C.E. There is NO year 0!
    LIFESPAN_LIST = [
        (619, "Adam", -4026, -3096, 930, "eden", "First man; overlapped with Methuselah for 243 years and Lamech for 56 years."),
        (657, "Seth", -3896, -2984, 912, "eden", "Born when Adam was 130; lived until just 14 years before Noah's birth."),
        (658, "Enosh", -3791, -2886, 905, "eden", "Witnessed both Adam (for 695 years) and Noah (for 84 years)."),
        (659, "Kenan", -3701, -2791, 910, "eden", "Overlapped with Adam for 605 years and Noah for 179 years."),
        (674, "Mahalalel", -3631, -2736, 895, "eden", "Fifth generation from Adam; overlapped with Noah for 234 years."),
        (677, "Jared", -3566, -2604, 962, "eden", "Second-longest recorded lifespan (962 years); overlapped with Noah for 366 years."),
        (678, "Enoch", -3404, -3039, 365, "eden", "Walked with God and was transferred at 365 years — 57 years after Adam's death."),
        (675, "Methuselah", -3339, -2370, 969, "eden", "Longest lifespan in the Bible (969 years); bridged Adam (243 yrs overlap) right to the Global Flood!"),
        (660, "Lamech", -3152, -2375, 777, "eden", "Father of Noah; overlapped with Adam for 56 years and died 5 years before the Flood."),
        (661, "Noah", -2970, -2020, 950, "flood", "Survived the 2370 B.C.E. Flood at age 600; died just 2 years before Abraham was born!"),
        (662, "Shem", -2468, -1868, 600, "flood", "Pre-Flood eyewitness who lived 502 years after the Flood — overlapping Abraham (150 yrs) and Isaac (50 yrs)!"),
        (676, "Arpachshad", -2368, -1930, 438, "flood", "Born 2 years after the Flood; lived past Abraham's crossing of the Euphrates."),
        (663, "Shelah", -2333, -1900, 433, "flood", "Post-Flood patriarch whose life stretched past the birth of Isaac."),
        (664, "Eber", -2303, -1839, 464, "flood", "Ancestor of the Hebrews; remarkably outlived Abraham by 4 years!"),
        (673, "Peleg", -2269, -2030, 239, "flood", "Earth was divided at the Tower of Babel during his 239-year lifespan."),
        (665, "Reu", -2239, -2000, 239, "flood", "Overlapped with Noah for 219 years and lived into Abraham's youth."),
        (672, "Serug", -2207, -1977, 230, "flood", "Abraham's great-grandfather; alive when Abraham was 41 years old."),
        (666, "Nahor", -2177, -2029, 148, "flood", "Abraham's grandfather; died 11 years before Abraham was born."),
        (667, "Terah", -2148, -1943, 205, "patriarchs", "Abraham's father; died at Haran in 1943 B.C.E. at age 205."),
        (671, "Abraham", -2018, -1843, 175, "patriarchs", "Born just 2 years after Noah's death; overlapped with Shem (150 yrs) and Jacob (15 yrs)!"),
        (51, "Sarah", -2008, -1881, 127, "patriarchs", "Only woman whose full age at death is recorded in Genesis; bore Isaac at age 90."),
        (find_idx("Ishmael", 900, 960), "Ishmael", -1932, -1795, 137, "patriarchs", "Abraham's firstborn son via Hagar; lived 137 years and fathered 12 chieftains."),
        (668, "Isaac", -1917, -1738, 180, "patriarchs", "Lived 180 years; overlapped with Shem for 50 years and Joseph for 29 years!"),
        (670, "Jacob/Israel", -1858, -1711, 147, "patriarchs", "Overlapped with Abraham for 15 years; moved Israel into Egypt at age 130 (1728 B.C.E.)."),
        (joseph_pat_idx, "Joseph", -1767, -1657, 110, "tribes", "Sold to Egypt at 17, became prime minister at 30, and saved Israel during famine."),
        (147, "Moses", -1593, -1473, 120, "tribes", "Led the 1513 B.C.E. Exodus at age 80 and guided Israel for 40 years to the Jordan."),
        (684, "Jesus", -2, 33, 33, "offspring", "Born in 2 B.C.E., baptized Fall 29 C.E. (~age 30), and gave his life in Nisan 33 C.E. (noting no year zero!)."),
    ]

    lifespans = []
    for lidx, name, birth, death, span, era, note in LIFESPAN_LIST:
        nid = idx_to_id[lidx]
        lifespans.append({
            "id": f"life_{nid}",
            "nodeId": nid,
            "name": name,
            "birthYear": birth,
            "deathYear": death,
            "lifespan": span,
            "era": era,
            "note": note,
            "jwUrl": node_by_id[nid]["jwUrl"],
        })

    # --- BUILD 19 CHRONOLOGY EVENTS (from bottom-left & bottom-center of PDF) ---
    CHRONOLOGY_LIST = [
        (-4026, "4026 B.C.E.", "Adam is created", "eden", "Creation of Adam and Eve in Eden; Genesis 3:15 pronounces the first Messianic promise.", [619, 618, 622]),
        (-2370, "2370 B.C.E.", "The Global Flood", "flood", "1,656 years after Adam's creation, Jehovah brings the Global Flood; Noah's family of 8 survives in the ark.", [661, 662, 675]),
        (-1943, "1943 B.C.E.", "Abraham crosses the Euphrates", "patriarchs", "427 years after the Flood, Abraham enters Canaan and the 430-year covenant period begins (Galatians 3:17).", [671, 667, 623]),
        (-1913, "1913 B.C.E.", "Isaac weaned — '400 years of affliction' begins", "patriarchs", "At age 5 Isaac is weaned and mocked by Ishmael, starting the 400-year affliction foretold at Genesis 15:13.", [668, find_idx("Ishmael", 900, 960)]),
        (-1728, "1728 B.C.E.", "Israel settles in Egypt", "patriarchs", "Jacob (Israel) moves his household of 70 into Goshen during the great famine under Prime Minister Joseph.", [670, joseph_pat_idx]),
        (-1513, "1513 B.C.E.", "Moses leads the Exodus from Egypt", "tribes", "Exactly 430 years after 1943 B.C.E., Jehovah delivers Israel from Egypt and inaugurates the Law Covenant at Sinai.", [147, 148, 743]),
        (-1117, "1117 B.C.E.", "Saul begins to rule as king in Israel", "david", "After 356 years of the Judges, Samuel anoints Saul of Benjamin as Israel's first human king.", [567, 146, 695]),
        (-997, "997 B.C.E.", "Kingdom of Israel splits into two", "david", "Following Solomon's death, the nation splits into Northern Israel and Southern Judah for 390 years (Ezekiel 4:5).", [739, 370, 638]),
        (-740, "740 B.C.E.", "Assyria destroys Northern Israel", "david", "The Assyrian Empire conquers Samaria and exiles the ten-tribe northern kingdom; David's line endures in Judah.", [381, 639]),
        (-607, "607 B.C.E.", "Babylon destroys Judah and Jerusalem", "exile", "Nebuchadnezzar destroys Jerusalem and Solomon's temple, ending 510 years of Israelite kings.", [393, 640]),
        (-539, "539 B.C.E.", "Medo-Persia conquers Babylon", "exile", "Cyrus the Great overthrows Babylon overnight, setting the stage for Jewish liberation and Daniel's 70-weeks prophecy.", [641, 633]),
        (-537, "537 B.C.E.", "Jews return under Governor Zerubbabel", "exile", "Under Cyrus' decree, a faithful remnant returns to Jerusalem led by Zerubbabel — key ancestor in both Matthew 1 and Luke 3.", [738, 395]),
        (-483, "483 B.C.E.", "Esther and Mordecai save the Jews", "exile", "In the Persian court, Queen Esther and Mordecai foil Haman's decree, safeguarding the Messianic nation.", [568, 260]),
        (-455, "455 B.C.E.", "Order to rebuild Jerusalem — 70 Weeks begin", "exile", "Artaxerxes authorizes Nehemiah to rebuild Jerusalem's walls, launching Daniel 9:25's 69-week (483-year) countdown to Messiah.", [633]),
        (-406, "406 B.C.E.", "Jerusalem is completely rebuilt", "exile", "7 prophetic weeks (49 years) after 455 B.C.E., Jerusalem's restoration is completed.", [633]),
        (-331, "331 B.C.E.", "Greece becomes dominant world power", "exile", "Alexander the Great defeats Persia, spreading Koine Greek — the future language of the Christian Greek Scriptures.", [642]),
        (-30, "30 B.C.E.", "Rome becomes dominant world power", "offspring", "Rome annexes Egypt and rules the Mediterranean world, preparing the census that brings Joseph and Mary to Bethlehem.", [643]),
        (-2, "2 B.C.E.", "The birth of Jesus in Bethlehem", "offspring", "Born in Bethlehem of Judea to Mary (Luke 3) and adopted by Joseph (Matthew 1), fulfilling Micah 5:2 and Luke 1:32.", [684, 444, 445, 634]),
        (29, "29 C.E.", "Jesus baptized — becomes the Promised Offspring", "offspring", "Exactly 483 years (69 prophetic weeks) after 455 B.C.E. (with no year zero!), Jesus is baptized by John and anointed as Messiah.", [684, 149, 633]),
    ]

    chronology = []
    for idx_c, (yr, yr_label, title, era, desc, linked_idxs) in enumerate(CHRONOLOGY_LIST, start=1):
        valid_ids = [idx_to_id[i] for i in linked_idxs if i and i in idx_to_id]
        primary_url = node_by_id[valid_ids[0]]["jwUrl"] if valid_ids else node_by_id[idx_to_id[JESUS_IDX]]["jwUrl"]
        chronology.append({
            "id": f"chr_{idx_c}",
            "order": idx_c,
            "year": yr,
            "yearLabel": yr_label,
            "title": title,
            "era": era,
            "description": desc,
            "linkedNodeIds": valid_ids,
            "jwUrl": primary_url,
        })

    # --- BUILD 7 GUIDED STORY ERAS ---
    STORIES = [
        {
            "id": "era-1",
            "chapter": 1,
            "eraKey": "eden",
            "title": "Eden & The First Promise",
            "years": "4026 – 2370 B.C.E.",
            "subtitle": "Ten pre-Flood generations guard the first Messianic hope",
            "narrative": [
                "Human history begins in 4026 B.C.E. with Adam and Eve in the Garden of Eden. Immediately after rebellion fractured humanity's peace, Jehovah uttered the Bible's foundational prophecy at Genesis 3:15: an 'offspring' of the woman would one day crush the serpent's head.",
                "Rather than ending humanity's story, God preserved a faithful line through Seth — appointed in place of righteous Abel. Remarkably, because pre-Flood lifespans stretched nearly a millennium, firsthand accounts of Eden traveled rapidly across generations: Methuselah overlapped with Adam for 243 years and lived right up to the year of the Global Flood!"
            ],
            "prophecyIds": ["p1"],
            "steppingStoneNodeIds": [idx_to_id[i] for i in [619, 618, 657, 678, 675, 660]],
            "checkIn": {
                "question": "How many years did Methuselah — the longest-lived human in Scripture — overlap with Adam?",
                "options": ["56 years", "243 years", "427 years", "930 years"],
                "correctIndex": 1,
                "explanation": "Adam died in 3096 B.C.E. and Methuselah was born in 3339 B.C.E., giving them an extraordinary 243-year overlap to pass down Eden's history directly!"
            }
        },
        {
            "id": "era-2",
            "chapter": 2,
            "eraKey": "flood",
            "title": "Flood & Origin of Nations",
            "years": "2370 – 1943 B.C.E.",
            "subtitle": "From Noah's Ark and Babel's dispersion to the birth of the Hebrews",
            "narrative": [
                "In 2370 B.C.E. — exactly 1,656 years after Adam's creation — the Global Flood swept away a violent world, sparing righteous Noah, his wife, and his three sons: Shem, Ham, and Japheth. From those three branches arose the entire Table of Nations mapped across the upper poster: Cushites, Egyptians, Canaanites, Elamites, Assyrians, Medes, Greeks, and more.",
                "Noah blessed Shem's God, Jehovah, marking Shem's line as the channel of the promise. Through Arpachshad, Shelah, and Eber (ancestor of the Hebrews), humanity reached the days of Peleg when Jehovah confused languages at the Tower of Babel. Amazingly, Shem lived 502 years after the Flood — long enough to overlap with Abraham for 150 years!"
            ],
            "prophecyIds": ["p1"],
            "steppingStoneNodeIds": [idx_to_id[i] for i in [661, 662, 676, 664, 673, 667]],
            "checkIn": {
                "question": "Which post-Flood patriarch's name means 'Division' because the languages at Babel were confused during his lifetime?",
                "options": ["Arpachshad", "Eber", "Peleg", "Serug"],
                "correctIndex": 2,
                "explanation": "Genesis 10:25 records that Peleg ('Division') was named because 'in his lifetime the earth was divided' at the dispersion from Babel."
            }
        },
        {
            "id": "era-3",
            "chapter": 3,
            "eraKey": "patriarchs",
            "title": "Patriarchs & Covenant",
            "years": "2018 – 1711 B.C.E.",
            "subtitle": "An oath sworn to Abraham, Isaac, and Jacob",
            "narrative": [
                "Born just two years after Noah died, Abraham left Ur of the Chaldeans and crossed the Euphrates in 1943 B.C.E., inaugurating the 430-year covenant period. Six major Messianic milestones unfold across the patriarchal era: the land covenant (Genesis 15:18), Abraham's new name (17:5), the oath that 'all nations' would be blessed through his offspring (22:18), and direct confirmations to Isaac (26:3) and Jacob (28:14; 32:28).",
                "Though Sarah was barren until age 90, Isaac was miraculously born in 1917 B.C.E. Through Rebekah came Jacob — renamed Israel — whose four wives bore twelve sons who would grow into a great nation during their stay in Egypt."
            ],
            "prophecyIds": ["p2", "p3", "p4", "p5", "p6", "p7"],
            "steppingStoneNodeIds": [idx_to_id[i] for i in [671, 51, 668, 682, 670, 680]],
            "checkIn": {
                "question": "What landmark event in 1943 B.C.E. initiated the 430-year period mentioned at Galatians 3:17?",
                "options": [
                    "Jacob moving his household into Egypt",
                    "Abraham crossing the Euphrates into Canaan",
                    "Isaac being weaned at age five",
                    "Moses leading Israel across the Red Sea"
                ],
                "correctIndex": 1,
                "explanation": "Abraham crossed the Euphrates into Canaan in 1943 B.C.E., when the Abrahamic covenant took effect — exactly 430 years before the 1513 B.C.E. Exodus and Law Covenant!"
            }
        },
        {
            "id": "era-4",
            "chapter": 4,
            "eraKey": "tribes",
            "title": "Twelve Tribes, Exodus & Judges",
            "years": "1728 – 1117 B.C.E.",
            "subtitle": "The scepter promised to Judah through Egypt, Sinai, and Bethlehem",
            "narrative": [
                "On his deathbed in Egypt (1711 B.C.E.), Jacob narrowed the Messianic line to one of his twelve sons: 'The scepter will not depart from Judah... until Shiloh comes' (Genesis 49:10). Meanwhile, Levi's tribe produced Moses, Aaron, and the priesthood, leading Israel out of Egypt in 1513 B.C.E. and into the Promised Land in 1473 B.C.E.",
                "During the turbulent 356 years of the Judges — featuring deliverers like Othniel, Ehud, Gideon, Samson, and Samuel — the quiet thread of Judah's line shone brightly through remarkable women of faith: Tamar, Rahab of Jericho, and loyal Ruth the Moabitess who married Boaz in Bethlehem."
            ],
            "prophecyIds": ["p8"],
            "steppingStoneNodeIds": [idx_to_id[i] for i in [736, 740, 743, 147, 436, 747, 439, 745]],
            "checkIn": {
                "question": "Which tribe received Jacob's Genesis 49:10 prophecy that the royal scepter would remain with it until Shiloh comes?",
                "options": ["Levi", "Joseph (Ephraim)", "Judah", "Benjamin"],
                "correctIndex": 2,
                "explanation": "Judah — fourth son of Jacob and Leah — was promised the royal scepter until Shiloh ('He Whose It Is'), the Messiah, arrives."
            }
        },
        {
            "id": "era-5",
            "chapter": 5,
            "eraKey": "david",
            "title": "House of David & Divided Kingdom",
            "years": "1117 – 607 B.C.E.",
            "subtitle": "An everlasting Kingdom covenant and two royal branches from Bath-sheba",
            "narrative": [
                "After Saul of Benjamin became Israel's first king in 1117 B.C.E., Jehovah chose Jesse's youngest son, David of Bethlehem. At 2 Samuel 7:12, God covenanted that David's throne would stand firm forever, and Psalm 110:4 revealed that David's royal heir would also be an eternal Priest like Melchizedek.",
                "Here the lineage chart splits into two monumental branches — BOTH descending from David and Bath-sheba! The Legal Lineage (Matthew 1) tracks the reigning kings of Judah through Solomon (Rehoboam, Hezekiah, Josiah), while the Natural Lineage (Luke 3) descends quietly through Solomon's brother Nathan. Even as Assyria toppled northern Israel (740 B.C.E.) and Isaiah foretold a 'twig out of the stump of Jesse' (Isaiah 11:10), both lines survived intact."
            ],
            "prophecyIds": ["p9", "p10", "p11"],
            "steppingStoneNodeIds": [idx_to_id[i] for i in [746, 669, 681, 739, 737, 381, 389]],
            "checkIn": {
                "question": "Through which two sons of David and Bath-sheba do the Matthew 1 Legal Line and Luke 3 Natural Line branch?",
                "options": [
                    "Absalom and Adonijah",
                    "Solomon (Matthew 1) and Nathan (Luke 3)",
                    "Rehoboam (Matthew 1) and Jeroboam (Luke 3)",
                    "Judah (Matthew 1) and Levi (Luke 3)"
                ],
                "correctIndex": 1,
                "explanation": "Matthew 1 traces the legal royal succession through Solomon to Joseph, while Luke 3 traces the natural bloodline through David's son Nathan to Mary!"
            }
        },
        {
            "id": "era-6",
            "chapter": 6,
            "eraKey": "exile",
            "title": "Exile, Return & The 70 Weeks",
            "years": "607 – 30 B.C.E.",
            "subtitle": "Zerubbabel's bridge, Esther's courage, and Daniel's 483-year countdown",
            "narrative": [
                "In 607 B.C.E., Babylon destroyed Jerusalem and toppled the Davidic monarchy. Yet Jehovah's word never failed. In 539 B.C.E., Medo-Persia conquered Babylon, and the angel Gabriel delivered Daniel 9:24-25's breathtaking chronological key: 69 prophetic 'weeks' (483 years) from the decree to rebuild Jerusalem would pinpoint the exact year Messiah would appear.",
                "In 537 B.C.E., Governor Zerubbabel — a remarkable bridge figure appearing in BOTH Matthew 1 and Luke 3 via Shealtiel — led exiles home to rebuild the temple. In 483 B.C.E., Queen Esther and Mordecai saved the nation from annihilation. Then in 455 B.C.E., Artaxerxes issued the command to reconstruct Jerusalem's walls, starting the 483-year countdown across the Persian, Greek (331 B.C.E.), and Roman (30 B.C.E.) empires!"
            ],
            "prophecyIds": ["p12"],
            "steppingStoneNodeIds": [idx_to_id[i] for i in [393, 395, 738, 568, 260, 316, 318]],
            "checkIn": {
                "question": "Counting 69 prophetic 'weeks' (483 years) from 455 B.C.E. — remembering there is NO zero year — arrives at what exact year?",
                "options": ["2 B.C.E.", "28 C.E.", "29 C.E.", "33 C.E."],
                "correctIndex": 2,
                "explanation": "455 B.C.E. to 1 B.C.E. is 454 years; crossing directly to 1 C.E. (no year 0) adds 1 year (455); plus 28 more years brings us to 29 C.E. — the exact year Jesus was baptized!"
            }
        },
        {
            "id": "era-7",
            "chapter": 7,
            "eraKey": "offspring",
            "title": "The Promised Offspring",
            "years": "2 B.C.E. – 29 C.E.",
            "subtitle": "Legal right and natural bloodline converge in Jesus of Nazareth",
            "narrative": [
                "In 2 B.C.E., after four millennia of carefully preserved genealogy, the two great Davidic streams converged in Bethlehem. Mary — descended naturally from David through Nathan and Heli (Luke 3:23-38) — received Gabriel's declaration at Luke 1:32 that her child would inherit David's throne forever. Joseph — legal royal heir through Solomon and Jacob (Matthew 1:1-16) — adopted Jesus as his legal son, giving Jesus both indisputable royal title and Davidic bloodline while bypassing the curse on Jeconiah's physical seed!",
                "In the fall of 29 C.E., right on schedule at the end of Daniel's 69 weeks, John the Baptizer (from Levi's priestly line) baptized Jesus in the Jordan River. Anointed by holy spirit, Jesus became the Messiah — The Promised Offspring foretold four thousand years earlier in Eden."
            ],
            "prophecyIds": ["p13", "p1"],
            "steppingStoneNodeIds": [idx_to_id[i] for i in [360, 445, 333, 444, 149, 684]],
            "checkIn": {
                "question": "Why are BOTH Matthew 1 (via Joseph) and Luke 3 (via Mary) essential to establish Jesus as the Promised Offspring?",
                "options": [
                    "One traces from Levi and the other from Benjamin",
                    "Matthew 1 establishes Jesus' legal right to David's throne via Solomon, while Luke 3 establishes his natural descent from David via Nathan",
                    "They list the same kings in reverse chronological order",
                    "Matthew 1 covers Adam to Abraham while Luke 3 covers Abraham to David"
                ],
                "correctIndex": 1,
                "explanation": "Through Joseph's legal adoption (Matthew 1 via Solomon) Jesus held the legal royal title, and through Mary (Luke 3 via Nathan) he held direct natural descent from King David!"
            }
        }
    ]

    # --- VERIFICATION ASSERTIONS ---
    bad_urls = [n for n in nodes if not n["jwUrl"].startswith("https://www.jw.org/finder")]
    unnamed = [n for n in nodes if not n["name"] or not n["name"].strip()]
    ligature_left = [n for n in nodes if any(c in n["name"] for c in LIGATURE_MAP.keys())]

    assert len(bad_urls) == 0, f"Found {len(bad_urls)} fallback/non-jw.org URLs!"
    assert len(unnamed) == 0, f"Found {len(unnamed)} unnamed nodes!"
    assert len(ligature_left) == 0, f"Found {len(ligature_left)} unnormalized ligatures: {[n['name'] for n in ligature_left]}"

    out_dir.mkdir(parents=True, exist_ok=True)
    metadata = {
        "pageWidth": page_w,
        "pageHeight": page_h,
        "totalNodes": len(nodes),
        "totalEdges": len(edges),
        "totalProphecies": len(prophecies),
        "totalLifespans": len(lifespans),
        "totalChronology": len(chronology),
        "totalStories": len(STORIES),
        "messianicCount": sum(1 for n in nodes if n["isMessianic"]),
        "bannerCount": sum(1 for n in nodes if n["isBanner"]),
        "zeroFallbackUrls": True,
        "zeroUnnamedNodes": True,
    }

    with open(out_dir / "meta.json", "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)
    with open(out_dir / "nodes.json", "w", encoding="utf-8") as f:
        json.dump(nodes, f, indent=2, ensure_ascii=False)
    with open(out_dir / "edges.json", "w", encoding="utf-8") as f:
        json.dump(edges, f, indent=2, ensure_ascii=False)
    with open(out_dir / "prophecies.json", "w", encoding="utf-8") as f:
        json.dump(prophecies, f, indent=2, ensure_ascii=False)
    with open(out_dir / "lifespans.json", "w", encoding="utf-8") as f:
        json.dump(lifespans, f, indent=2, ensure_ascii=False)
    with open(out_dir / "chronology.json", "w", encoding="utf-8") as f:
        json.dump(chronology, f, indent=2, ensure_ascii=False)
    with open(out_dir / "stories.json", "w", encoding="utf-8") as f:
        json.dump(STORIES, f, indent=2, ensure_ascii=False)

    print("SUCCESS! Extraction complete and verified:")
    print(json.dumps(metadata, indent=2))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Extract biblical lineage data from The Promised Offspring.pdf")
    parser.add_argument(
        "--pdf",
        default="/tmp/The Promised Offspring.pdf",
        help="Path to The Promised Offspring.pdf",
    )
    parser.add_argument(
        "--out",
        default=str(Path(__file__).resolve().parent.parent / "src" / "data"),
        help="Output directory for JSON datasets",
    )
    args = parser.parse_args()
    extract_all(args.pdf, Path(args.out))
