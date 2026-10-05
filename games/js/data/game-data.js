(() => {
  window.GAME_DATA = {
    ENEMY_TYPES: {
      fodder: {name:'Lính Lác', attackType:'melee', hp:10, speed:50, radius:8, damage:12, score:10, visual:'slime'},
      fast: {name:'Yến Tử', attackType:'melee', hp:5, speed:150, radius:6, damage:12, score:20, visual:'fire'},
      ranged: {name:'Cung Thủ', attackType:'ranged', hp:15, speed:40, radius:8, damage:12, score:30, shootInterval:2.0, attackRange:300, preferredDistance:220, visual:'poison'},
      boss: {name:'Giáo Chủ', attackType:'melee', hp:500, speed:30, radius:20, damage:28, score:1000, visual:'boss'}
    },

    WEAPON_EVOLUTION: [
      {id:'dao_co_ban',name:'Đao',tier:0,tier_name:'Cơ bản',upgrades_to:['kiem_bat_hu_1','phien_bat_hu_1','thuong_bat_hu_1']},
      {id:'kiem_bat_hu_1',name:'Kiếm',tier:1,tier_name:'Bất Hủ bậc 1',upgrades_to:['phu_do_than_thoai_2','huyen_thien_than_thoai_2']},
      {id:'phien_bat_hu_1',name:'Phiên',tier:1,tier_name:'Bất Hủ bậc 1',upgrades_to:['van_hon_than_thoai_2','tam_diem_than_thoai_2']},
      {id:'thuong_bat_hu_1',name:'Thương',tier:1,tier_name:'Bất Hủ bậc 1',upgrades_to:['long_uyen_than_thoai_2','that_sat_than_thoai_2']},
      {id:'phu_do_than_thoai_2',name:'Phù Đô',tier:2,tier_name:'Thần Thoại bậc 2',upgrades_to:['thanh_truc_phep_mau_3']},
      {id:'thanh_truc_phep_mau_3',name:'Thanh Trúc Phong Vân Kiếm',tier:3,tier_name:'Phép Màu bậc 3',upgrades_to:[]},
      {id:'huyen_thien_than_thoai_2',name:'Huyền Thiên Trảm Linh Kiếm',tier:2,tier_name:'Thần Thoại bậc 2',upgrades_to:['luc_duong_phep_mau_3']},
      {id:'luc_duong_phep_mau_3',name:'Lục Dương Lôi Hỏa Kiếm',tier:3,tier_name:'Phép Màu bậc 3',upgrades_to:[]},
      {id:'van_hon_than_thoai_2',name:'Vạn Hồn Phiên',tier:2,tier_name:'Thần Thoại bậc 2',upgrades_to:['u_minh_phep_mau_3']},
      {id:'u_minh_phep_mau_3',name:'U Minh Dẫn Phiên',tier:3,tier_name:'Phép Màu bậc 3',upgrades_to:[]},
      {id:'tam_diem_than_thoai_2',name:'Tam Diễm Phiến',tier:2,tier_name:'Thần Thoại bậc 2',upgrades_to:['ngu_hanh_phep_mau_3']},
      {id:'ngu_hanh_phep_mau_3',name:'Ngũ Hành Phiến',tier:3,tier_name:'Phép Màu bậc 3',upgrades_to:[]},
      {id:'long_uyen_than_thoai_2',name:'Long Uyên Thương',tier:2,tier_name:'Thần Thoại bậc 2',upgrades_to:['long_ngam_phep_mau_3']},
      {id:'long_ngam_phep_mau_3',name:'Long Ngâm Chân Nguyên Thương',tier:3,tier_name:'Phép Màu bậc 3',upgrades_to:[]},
      {id:'that_sat_than_thoai_2',name:'Thất Sát Âm La Thương',tier:2,tier_name:'Thần Thoại bậc 2',upgrades_to:['han_nguyet_phep_mau_3']},
      {id:'han_nguyet_phep_mau_3',name:'Hàn Nguyệt Sương Tinh Thương',tier:3,tier_name:'Phép Màu bậc 3',upgrades_to:[]}
    ],

    REALMS: [
      {id:'pham_nhan',name:'Phàm Nhân',start:0},
      {id:'luyen_khi',name:'Luyện Khí',start:45},
      {id:'truc_co',name:'Trúc Cơ',start:90},
      {id:'kim_dan',name:'Kim Đan',start:150},
      {id:'nguyen_anh',name:'Nguyên Anh',start:220},
      {id:'hoa_than',name:'Hóa Thần',start:300},
      {id:'vuot_kiep',name:'Vượt Kiếp',start:390},
      {id:'phi_thang',name:'Phi Thăng',start:480}
    ]
  };
})();
