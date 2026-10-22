/* ==========================================================================
   Figures & trims — copied from buildatrophy.com (trophy-data.js).
   Add a JDS SKU to "sku" as you confirm each one. "part" is the name printed
   on the parts list (leave blank to use "<name> Figure" / "<name> Trim").
   ========================================================================== */

export const FIGURES = [
  {"name": "Baseball (Male)", "category": "Sports", "sub": "Baseball/Softball", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/StandingMaleBaseball.png?v=1779987018", "scale": 1.3, "sku": "FIG9148", "part": "Standing Baseball (Male) Figure"},
  {"name": "Baseball (Flame)", "category": "Sports", "sub": "Baseball/Softball", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_XUgI_Flame_20Baseball.png?v=1742759266", "scale": 1.3, "sku": "", "part": "", "discontinued": true},
  {"name": "Baseball (Stars)", "category": "Sports", "sub": "Baseball/Softball", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/FIG4050_transparent.png?v=1779985904", "scale": 1.3, "sku": "", "part": ""},   // image filename suggests FIG4050 — verify, then fill sku
  {"name": "Baseball (MidNite)", "category": "Sports", "sub": "Baseball/Softball", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/MidNiteStars-baseball.png?v=1779987018", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Softball (Female)", "category": "Sports", "sub": "Baseball/Softball", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_vhvh_Softball_20_28female_29.png?v=1742177874", "scale": 1.3, "sku": "", "part": ""},
  {"name": "T-Ball (Male)", "category": "Sports", "sub": "Baseball/Softball", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_UCQE_T-Ball_20_28male_29.png?v=1742177920", "scale": 1.4, "sku": "", "part": ""},
  {"name": "T-Ball (Female)", "category": "Sports", "sub": "Baseball/Softball", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_YEZu_T-Ball_20_28female_29.png?v=1742177911", "scale": 1.4, "sku": "", "part": ""},
  {"name": "Baseball (Bat-Catch)", "category": "Sports", "sub": "Baseball/Softball", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/Baseball_Bat-Catch.png?v=1780010013", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Baseball (ColorStar)", "category": "Sports", "sub": "Baseball/Softball", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/Baseball_ColorStar.png?v=1780010015", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Baseball (Drop Bat)", "category": "Sports", "sub": "Baseball/Softball", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/Baseball_Drop_Bat.png?v=1780010016", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Baseball (Falcon)", "category": "Sports", "sub": "Baseball/Softball", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/Baseball_Falcon.png?v=1780010018", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Baseball (Shooting Star)", "category": "Sports", "sub": "Baseball/Softball", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/Baseball_Shooting_Star.png?v=1780010020", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Baseball (Silhouette)", "category": "Sports", "sub": "Baseball/Softball", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/Baseball_Silhouette.png?v=1780010022", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Baseball (Star Arch)", "category": "Sports", "sub": "Baseball/Softball", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/Baseball_Star_Arch.png?v=1780010024", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Baseball (Star Backdrop)", "category": "Sports", "sub": "Baseball/Softball", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/Baseball_Star_Backdrop.png?v=1780010025", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Softball (Bat-Catch)", "category": "Sports", "sub": "Baseball/Softball", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/Softball_Bat-Catch.png?v=1780010027", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Softball (ColorStar)", "category": "Sports", "sub": "Baseball/Softball", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/Softball_ColorStar.png?v=1780010029", "scale": 1.2, "sku": "", "part": ""},
  {"name": "Softball (Drop Bat)", "category": "Sports", "sub": "Baseball/Softball", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/Softball_Drop_Bat.png?v=1780010031", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Softball (Star Arch)", "category": "Sports", "sub": "Baseball/Softball", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/Softball_Star_Arch.png?v=1780010033", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Softball (Star Backdrop)", "category": "Sports", "sub": "Baseball/Softball", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/Softball_Star_Backdrop.png?v=1780010034", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Basketball (Male)", "category": "Sports", "sub": "Basketball", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_MkSG_Basketball_20_28Male_29.png?v=1742746504", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Basketball (Female)", "category": "Sports", "sub": "Basketball", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_iiIF_Basketball_20_28Female_29.png?v=1742746510", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Basketball (Flame)", "category": "Sports", "sub": "Basketball", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_4LMq_Flame_20Basketball.png?v=1742759452", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Basketball (MidNite)", "category": "Sports", "sub": "Basketball", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/MidNiteStars-basketball.png?v=1779987018", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Football (Flame)", "category": "Sports", "sub": "Football", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_HIHF_Flame_20Football.png?v=1742759340", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Football (MidNite)", "category": "Sports", "sub": "Football", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/MidNiteStars-football.png?v=1779987018", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Cheer (MidNite)", "category": "Sports", "sub": "Cheer", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/MidNiteStars-cheer.png?v=1779987018", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Soccer Kick (Male)", "category": "Sports", "sub": "Soccer", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_z6n8_Soccer_20_28kick_20male_29.png?v=1742177864", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Soccer Kick (Female)", "category": "Sports", "sub": "Soccer", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_k23Q_Soccer_20_28kick_20female_29.png?v=1742177854", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Soccer Bicycle (Male)", "category": "Sports", "sub": "Soccer", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_h37W_Soccer_20_28bicycle_20male_29.png?v=1742177846", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Soccer Bicycle (Female)", "category": "Sports", "sub": "Soccer", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_J2uf_Soccer_20_28bicycle_20female_29.png?v=1742177836", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Soccer (Flame)", "category": "Sports", "sub": "Soccer", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_poI3_Flame_20Soccer.png?v=1742759231", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Male Golfer", "category": "Sports", "sub": "Golf", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_QEsQ_Golf_20_28male_29.png?v=1742177578", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Female Golfer", "category": "Sports", "sub": "Golf", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_o7G8_Golf_20_28female_29.png?v=1742177554", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Hole In One", "category": "Sports", "sub": "Golf", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_C1qs_Golf_20_28hole_20in_20one_29.png?v=1742177567", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Martial Arts Kick (Male)", "category": "Sports", "sub": "Martial Arts/Wrestling", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_Ljv2_Martial_20Arts_20_28kick_20male_29.png?v=1742177687", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Martial Arts Kick (Female)", "category": "Sports", "sub": "Martial Arts/Wrestling", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_U7dx_Martial_20Arts_20_28kick_20female_29.png?v=1742177674", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Wrestler (Male)", "category": "Sports", "sub": "Martial Arts/Wrestling", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_UrMM_Wrestler_20_28male_29.png?v=1742178011", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Wrestling Slam", "category": "Sports", "sub": "Martial Arts/Wrestling", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_qsTb_Wrestling_20_28slam_29.png?v=1742759280", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Race Car", "category": "Sports", "sub": "Motorsports", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_EvXz_Car_201.png?v=1742178115", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Drag Racecar", "category": "Sports", "sub": "Motorsports", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_RZAh_Car_203.png?v=1742178141", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Truck", "category": "Sports", "sub": "Motorsports", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_cTc4_Car_202_20_28truck_29.png?v=1742178128", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Motocross", "category": "Sports", "sub": "Motorsports", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_H17v_Motocross.png?v=1742759496", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Go-Cart", "category": "Sports", "sub": "Motorsports", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_sm53_Go-Cart.png?v=1742759371", "scale": 1.3, "sku": "", "part": ""},
  {"name": "BMX Cycling", "category": "Sports", "sub": "Cycling", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_2ssH_Cycling_20_28BMX_29.png?v=1742759354", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Cyclist", "category": "Sports", "sub": "Cycling", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_ymjK_Cyclist.png?v=1742178213", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Hockey (Male)", "category": "Sports", "sub": "Hockey/Lacrosse", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_AhvQ_Hockey_20_28male_29.png?v=1742177626", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Lacrosse (Male)", "category": "Sports", "sub": "Hockey/Lacrosse", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_3G2c_Lacrosse_20_28male_29.png?v=1742759526", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Lacrosse (Female)", "category": "Sports", "sub": "Hockey/Lacrosse", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_Nbqk_Lacrosse_20_28female_29.png?v=1742759273", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Volleyball (Female)", "category": "Sports", "sub": "Volleyball", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_W2SG_Volleyball_20_28female_29.png?v=1742177982", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Volleyball (Girl)", "category": "Sports", "sub": "Volleyball", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_xwpQ_Volleyball_20_28girl_29.png?v=1742177998", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Tennis (Male)", "category": "Sports", "sub": "Tennis", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_9WjV_Tennis_20_28male_29.png?v=1742177944", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Tennis (Female)", "category": "Sports", "sub": "Tennis", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_1Wuh_Tennis_20_28female_29.png?v=1742177935", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Swimmer (Male)", "category": "Sports", "sub": "Swimming", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_ng37_Swimmer_20_28male_29.png?v=1742177902", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Swimmer (Female)", "category": "Sports", "sub": "Swimming", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_j06n_Swimmer_20_28female_29.png?v=1742177892", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Bowling (Male)", "category": "Sports", "sub": "Bowling", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_S0CO_Bowling_20_28male_29.png?v=1742178101", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Bowling (Female)", "category": "Sports", "sub": "Bowling", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_FZsJ_Bowling_20_28female_29.png?v=1742178090", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Archery (Male)", "category": "Sports", "sub": "Archery", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_ZgUq_Archery_20_28male_29.png?v=1742178037", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Archery (Female)", "category": "Sports", "sub": "Archery", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_yctQ_Archery_20_28female_29.png?v=1742178023", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Pool (Male)", "category": "Sports", "sub": "Pool/Darts", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_loPC_Pool_20_28male_29.png?v=1742177790", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Pool (Female)", "category": "Sports", "sub": "Pool/Darts", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_F9pr_Pool_20_28female_29.png?v=1742177801", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Darts (Male)", "category": "Sports", "sub": "Pool/Darts", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_jye8_Darts_20_28male_29.png?v=1742759252", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Darts (Female)", "category": "Sports", "sub": "Pool/Darts", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_bBXD_Darts_20_28female_29.png?v=1742759239", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Gymnastics (Male)", "category": "Sports", "sub": "Gymnastics", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_HU2u_Gymnastics_20_28male_29.png?v=1742177615", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Gymnastics (Female)", "category": "Sports", "sub": "Gymnastics", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_rXwa_Gymnastics_20_28female_29.png?v=1742759208", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Running (Male)", "category": "Sports", "sub": "Running", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_7lBR_Running_20_28male_29.png?v=1742177828", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Running (Female)", "category": "Sports", "sub": "Running", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_AH6n_Running_20_28female_29.png?v=1742177811", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Horse", "category": "Animals", "sub": "", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_uClt_Horse.png?v=1742177650", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Horse's Rear", "category": "Animals", "sub": "", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_MIgS_Horse_20Rear.png?v=1742177638", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Pig", "category": "Animals", "sub": "", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_sw2V_Pig.png?v=1742177772", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Chicken", "category": "Animals", "sub": "", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_WPNe_Chicken.png?v=1742178199", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Goat", "category": "Animals", "sub": "", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_muHB_Goat.png?v=1742759286", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Sheep", "category": "Animals", "sub": "", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_ougm_Sheep.png?v=1742759305", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Fish", "category": "Animals", "sub": "", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_Sy9K_Fish.png?v=1742177486", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Fisherman", "category": "Animals", "sub": "", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_j0Zt_Fishing.png?v=1742177499", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Hunter", "category": "Animals", "sub": "", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_dn6X_Hunter.png?v=1742759216", "scale": 1.3, "sku": "", "part": "", "discontinued": true},
  {"name": "Graduate (Male)", "category": "Academic/Arts", "sub": "", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_GJZo_Graduate_20_28male_29.png?v=1742760941", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Graduate (Female)", "category": "Academic/Arts", "sub": "", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_2pRR_Graduate_20_28female_29.png?v=1742177591", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Lamp of Knowledge", "category": "Academic/Arts", "sub": "", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_633y_Lamp_20of_20Knowledge.png?v=1742759222", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Majorette", "category": "Academic/Arts", "sub": "", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_CFA9_Drum_20Major.png?v=1742177474", "scale": 1.3, "sku": "RP89475", "part": "5″ Female Majorette Figure"},
  {"name": "Baton Twirler", "category": "Academic/Arts", "sub": "", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_qOgU_Majorette.png?v=1742177661", "scale": 1.3, "sku": "RP89466", "part": "6″ Female Baton Twirler Figure"},
  {"name": "Ballerina", "category": "Academic/Arts", "sub": "", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_8Mz2_Dance_20_28Ballerina_29.png?v=1742178225", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Jazz Dancer", "category": "Academic/Arts", "sub": "", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_AjCy_Dance_201.png?v=1742178240", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Ballroom Dance", "category": "Academic/Arts", "sub": "", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_RcKg_Ballroom_20Dancing.png?v=1742759485", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Drama", "category": "Academic/Arts", "sub": "", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_COKj_Drama.png?v=1742178272", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Victory (Male)", "category": "Misc", "sub": "", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_aqpf_Victory_20_28male_29.png?v=1742177965", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Victory (Female)", "category": "Misc", "sub": "", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_sWyX_Victory_20_28female_29.png?v=1742177953", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Oscar Style", "category": "Misc", "sub": "", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_Ow7H_Oscar_20Style.png?v=1742177760", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Cross", "category": "Misc", "sub": "", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_XdIx_Cross.png?v=1742759202", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Poker Hand", "category": "Misc", "sub": "", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_GHJU_Poker_20Hand.png?v=1742759422", "scale": 1.3, "sku": "", "part": ""},
  {"name": "Beauty Pageant", "category": "Misc", "sub": "", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_9o7D_Beauty_20Pageant.png?v=1742178078", "scale": 1.3, "sku": "", "part": ""},
];

/* discontinued:true = JDS no longer makes it. Hidden from the pickers and the SKU
   matcher; an old order that uses one still opens, with a warning. */

/* Other names people use for a figure. Looked up after an exact match fails. */
export const ALIASES = {
  'Drum Major': 'Majorette'
};

/* year:true trims get the order year in their part name and use YEAR_TRIM_SKUS.
   multiOnly:true = only offered on 2+ column trophies (holders need a riser). */
export const TRIMS = [
  {"name": "Standup 2″ Insert Holder", "category": "Inserts/Holders", "url": "", "scale": 1, "multiOnly": false, "holder": true, "year": false, "sku": "RP83053", "part": "3 1/4\" Gold Standup 2\" Insert Holder"},   // JDS photo is used for the picture (url left blank)
  {"name": "Year (Full)", "category": "Years/Stars", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_ANDr_Trim--13-2025.png?v=1781110978", "scale": 0.75, "multiOnly": false, "holder": false, "year": true, "sku": "", "part": ""},
  {"name": "Year (Short)", "category": "Years/Stars", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_6kvO_Trim--10-25.png?v=1781110998", "scale": 0.75, "multiOnly": false, "holder": false, "year": true, "sku": "", "part": ""},
  {"name": "3-Star Year (Full)", "category": "Years/Stars", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_rJuU_Trim--12-3Star2025.png", "scale": 0.75, "multiOnly": false, "holder": false, "year": true, "sku": "", "part": ""},
  {"name": "3-Star Year (Short)", "category": "Years/Stars", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_7scj_Trim--11-3Star25.png", "scale": 0.75, "multiOnly": false, "holder": false, "year": true, "sku": "", "part": ""},
  {"name": "Ribbon 1st", "category": "Place", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_guch_Trim--1-1st.png?v=1742740273", "scale": 1, "multiOnly": false, "holder": false, "year": false, "sku": "", "part": ""},
  {"name": "Ribbon 2nd", "category": "Place", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_XTWT_Trim--2-2nd.png?v=1742740277", "scale": 1, "multiOnly": false, "holder": false, "year": false, "sku": "", "part": ""},
  {"name": "Ribbon 3rd", "category": "Place", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_1mds_Trim--3-3rd.png?v=1742740285", "scale": 1, "multiOnly": false, "holder": false, "year": false, "sku": "", "part": ""},
  {"name": "Star", "category": "Years/Stars", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_X5cK_Trim--16-Star.png?v=1742740359", "scale": 1, "multiOnly": false, "holder": false, "year": false, "sku": "", "part": ""},
  {"name": "Eagle", "category": "Eagles", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_fFcv_Trim--14-Eagle.png?v=1742740346", "scale": 1, "multiOnly": false, "holder": false, "year": false, "sku": "GME4", "part": "2¼″ Gold Metal Eagle with Feathered Back"},
  {"name": "Baseball (Color)", "category": "Sports", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_n3cX_Trim--17-Color_20Baseball.png?v=1742740366", "scale": 1, "multiOnly": false, "holder": false, "year": false, "sku": "", "part": ""},
  {"name": "Softball (Color)", "category": "Sports", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_gTxq_Trim--21-Color_20-_20Softball.png?v=1742740393", "scale": 1, "multiOnly": false, "holder": false, "year": false, "sku": "", "part": ""},
  {"name": "Soccer (Color)", "category": "Sports", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_k0P2_Trim--20-Color_20Soccer.png?v=1742740389", "scale": 1, "multiOnly": false, "holder": false, "year": false, "sku": "", "part": ""},
  {"name": "Football (Color)", "category": "Sports", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_mAVM_Trim--19-Color_20Football.png?v=1742740379", "scale": 1, "multiOnly": false, "holder": false, "year": false, "sku": "", "part": ""},
  {"name": "Basketball (Color)", "category": "Sports", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_WNcv_Trim--18-Color_20Basketball.png?v=1742740370", "scale": 1, "multiOnly": false, "holder": false, "year": false, "sku": "", "part": ""},
  {"name": "8-Star Holder", "category": "Inserts/Holders", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/8-star-insert-holder.png?v=1765299305", "scale": 1.6, "multiOnly": true, "holder": true, "year": false, "sku": "", "part": ""},
  {"name": "Gold V Holder", "category": "Inserts/Holders", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/RP92746.png?v=1765467460", "scale": 1.6, "multiOnly": true, "holder": true, "year": false, "sku": "", "part": ""},   // image filename suggests RP92746 — verify, then fill sku
  {"name": "Falcon Holder", "category": "Inserts/Holders", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/FIG4506.png?v=1765467460", "scale": 1.6, "multiOnly": true, "holder": true, "year": false, "sku": "", "part": ""},   // image filename suggests FIG4506 — verify, then fill sku
  {"name": "Rising Wreath", "category": "Inserts/Holders", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/PH101.png?v=1765467460", "scale": 1.6, "multiOnly": true, "holder": true, "year": false, "sku": "PH101", "part": "6½″ Rising Wreath 2″ Insert Holder Figure"},
  {"name": "7-Star Holder", "category": "Inserts/Holders", "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/RP92766.png?v=1765467460", "scale": 1.6, "multiOnly": true, "holder": true, "year": false, "sku": "", "part": ""},   // image filename suggests RP92766 — verify, then fill sku
];

/* Year trims change SKU every year. Add next year's SKU when you order it. */
export const YEAR_TRIM_SKUS = {
  'Year (Full)':        { 2026: 'TRM7726' },
  'Year (Short)':       {},
  '3-Star Year (Full)': {},
  '3-Star Year (Short)':{}
};

/* Column colors + base textures (swatch images from the Shopify CDN) */
export const SWATCHES = {
  columns: {
    "Red": {
      "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/RED_COLUMNS_SWATCH.jpg?v=1764126163",
      "fallback": "linear-gradient(to right,#700,#e22,#700)"
    },
    "Blue": {
      "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/BLUE_COLUMNS_SWATCH.jpg?v=1764126163",
      "fallback": "linear-gradient(to right,#024,#26a,#024)"
    },
    "Green": {
      "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/GREEN_COLUMNS_SWATCH.jpg?v=1764126162",
      "fallback": "linear-gradient(to right,#040,#2a2,#040)"
    },
    "Black": {
      "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/BLACK_COLUMNS_SWATCH.jpg?v=1764126163",
      "fallback": "linear-gradient(to right,#111,#444,#111)"
    },
    "Silver": {
      "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/SILVER_COLUMNS_SWATCH.jpg?v=1764126162",
      "fallback": "linear-gradient(to right,#888,#ddd,#888)"
    },
    "Gold": {
      "url": "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/GOLD_COLUMNS_SWATCH.jpg?v=1764126163",
      "fallback": "linear-gradient(to right,#640,#fd0,#640)"
    }
  },
  bases: {
    white:  { url: "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/WHITE_MARBLE_SWATCH.jpg?v=1764126162", fallback: '#ecebe7' },
    black:  { url: "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/BLACK_MARBLE_SWATCH.jpg?v=1764126163", fallback: '#26272b' },
    cherry: { url: "https://cdn.shopify.com/s/files/1/0590/2244/2570/files/WOOD_GRAIN_SWATCH.jpg?v=1764126162", fallback: '#6b3a26' }
  }
};

export const ART = {
  cup:   'https://cdn.shopify.com/s/files/1/0590/2244/2570/files/CUP_WITH_TOP.png?v=1764196280',
  eagle: 'https://cdn.shopify.com/s/files/1/0590/2244/2570/files/a_fFcv_Trim--14-Eagle.png?v=1742740346'
};
