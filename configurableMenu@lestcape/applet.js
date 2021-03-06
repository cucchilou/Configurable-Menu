//Cinnamon Applet: Configurable Menu version v0.9-Beta
//Release Date: 01 February 2014
//
//Authors: Lester Carballo Pérez(https://github.com/lestcape) and Garibaldo(https://github.com/Garibaldo).
//
//          Email: lestcape@gmail.com     Website: https://github.com/lestcape/Configurable-Menu
//
// "This is a fork of the Cinnamon stock menu, but with much more features
//  and extremely configurable."
//
// This program is free software:
//
//    You can redistribute it and/or modify it under the terms of the
//    GNU General Public License as published by the Free Software
//    Foundation, either version 3 of the License, or (at your option)
//    any later version.
//
//    This program is distributed in the hope that it will be useful,
//    but WITHOUT ANY WARRANTY; without even the implied warranty of
//    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//    GNU General Public License for more details.
//
//    You should have received a copy of the GNU General Public License
//    along with this program.  If not, see <http://www.gnu.org/licenses/>.
//

/*

const Signals = imports.signals;
const ICON_SIZE = 16;
*/
const Util = imports.misc.util;
const Tweener = imports.ui.tweener;
const Pango = imports.gi.Pango;
const DND = imports.ui.dnd;
const GMenu = imports.gi.GMenu;
const Meta = imports.gi.Meta;
const Clutter = imports.gi.Clutter;
const Applet = imports.ui.applet;
const ScreenSaver = imports.misc.screenSaver;
const GnomeSession = imports.misc.gnomeSession;
const St = imports.gi.St;
const Gio = imports.gi.Gio;
const PopupMenu = imports.ui.popupMenu;
const Gtk = imports.gi.Gtk;
const Mainloop = imports.mainloop;
const Settings = imports.ui.settings;
const Main = imports.ui.main;
const Cinnamon = imports.gi.Cinnamon;
const DocInfo = imports.misc.docInfo;
const Lang = imports.lang;
const AppFavorites = imports.ui.appFavorites;
const GLib = imports.gi.GLib;
const AccountsService = imports.gi.AccountsService;
const FileUtils = imports.misc.fileUtils;
const AppletPath = imports.ui.appletManager.applets['configurableMenu@lestcape'];
const CinnamonMenu = AppletPath.cinnamonMenu;
const BoxPointer = imports.ui.boxpointer;
const Gettext = imports.gettext;

let appsys = Cinnamon.AppSystem.get_default();

const USER_DESKTOP_PATH = FileUtils.getUserDesktopDir();

//const MAX_FAV_ICON_SIZE = 32;
//const HOVER_ICON_SIZE = 68;
//const APPLICATION_ICON_SIZE = 22;
const MAX_RECENT_FILES = 20;
//const CATEGORY_ICON_SIZE = 22;
/*
const LIB_PATH = '/usr/share/cinnamon/applets/menu@cinnamon.org';
imports.searchPath.unshift(LIB_PATH);
const CinnamonMenu = imports.applet;
*/

function _(str) {
   let resultConf = Gettext.dgettext("configurableMenu@lestcape", str);
   if(resultConf != str) {
      return resultConf;
   }
   return Gettext.gettext(str);
};


function toUTF8FromHex(hex) {
   return toUTF8FromAscii(toAscciiFromHex(hex));
};

function toAscciiFromHex(encode) {
   let result = "";
   try {
      let splitEncode = encode.split(/%[0-9A-F]{2}/);
      let last, transcode;
      for(let i = 0; i < splitEncode.length; i++) {
        if(splitEncode[i] != "") {
           result += splitEncode[i];
        } else {
           while((i < splitEncode.length)&&(splitEncode[i] == "")) {
             i++;
           }
           if(i == splitEncode.length)
             last = encode.indexOf(splitEncode[i-1]);
           else
             last = encode.indexOf(splitEncode[i]);
           transcode = encode.substr(result.length, last - result.length).toLowerCase();
           result += decodeURIComponent(transcode.replace(/\s+/g, '').replace(/%[0-9A-F]{2}/g, '%$&')) + splitEncode[i];
        }
      }
   } catch(e) {
      Main.notify("Error in transcode" + e.message);
   }
   return result;
};

function toAsciiFromUTF8(utf8) {
   // From: http://phpjs.org/functions
   var tmp_arr = [], i = 0, ac = 0, c1 = 0, c2 = 0, c3 = 0, c4 = 0;

   utf8 += '';

   while(i < utf8.length) {
      c1 = utf8.charCodeAt(i);
      if(c1 <= 191) {
         tmp_arr[ac++] = String.fromCharCode(c1);
         i++;
      } else if (c1 <= 223) {
         c2 = utf8.charCodeAt(i + 1);
         tmp_arr[ac++] = String.fromCharCode(((c1 & 31) << 6) | (c2 & 63));
         i += 2;
      } else if (c1 <= 239) {
         // http://en.wikipedia.org/wiki/UTF-8#Codepage_layout
         c2 = utf8.charCodeAt(i + 1);
         c3 = utf8.charCodeAt(i + 2);
         tmp_arr[ac++] = String.fromCharCode(((c1 & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
         i += 3;
      } else {
         c2 = utf8.charCodeAt(i + 1);
         c3 = utf8.charCodeAt(i + 2);
         c4 = utf8.charCodeAt(i + 3);
         c1 = ((c1 & 7) << 18) | ((c2 & 63) << 12) | ((c3 & 63) << 6) | (c4 & 63);
         c1 -= 0x10000;
         tmp_arr[ac++] = String.fromCharCode(0xD800 | ((c1>>10) & 0x3FF));
         tmp_arr[ac++] = String.fromCharCode(0xDC00 | (c1 & 0x3FF));
         i += 4;
      }
   }
   return tmp_arr.join('');
};

function toUTF8FromAscii(ascii) {
   // From: http://phpjs.org/functions
   if(ascii === null || typeof ascii === "undefined") {
      return "";
   }

   var string = (ascii + ''); // .replace(/\r\n/g, "\n").replace(/\r/g, "\n");
   var utftext = '',
      start, end, stringl = 0;

   start = end = 0;
   stringl = string.length;
   for(var n = 0; n < stringl; n++) {
      var c1 = string.charCodeAt(n);
      var enc = null;

      if(c1 < 128) {
         end++;
      } else if (c1 > 127 && c1 < 2048) {
         enc = String.fromCharCode(
           (c1 >> 6)         | 192,
           ( c1        & 63) | 128
         );
      } else if (c1 & 0xF800 != 0xD800) {
         enc = String.fromCharCode(
            (c1 >> 12)        | 224,
            ((c1 >> 6)  & 63) | 128,
            ( c1        & 63) | 128
         );
      } else { // surrogate pairs
         if(c1 & 0xFC00 != 0xD800) { throw new RangeError("Unmatched trail surrogate at " + n); }
         var c2 = string.charCodeAt(++n);
         if (c2 & 0xFC00 != 0xDC00) { throw new RangeError("Unmatched lead surrogate at " + (n-1)); }
         c1 = ((c1 & 0x3FF) << 10) + (c2 & 0x3FF) + 0x10000;
         enc = String.fromCharCode(
            (c1 >> 18)        | 240,
            ((c1 >> 12) & 63) | 128,
            ((c1 >> 6)  & 63) | 128,
            ( c1        & 63) | 128
         );
      }
      if(enc !== null) {
         if(end > start) {
            utftext += string.slice(start, end);
         }
         utftext += enc;
         start = end = n + 1;
      }
   }

   if(end > start) {
      utftext += string.slice(start, stringl);
   }
   return utftext;
};

function ScrollItemsBox(parent, panelToScroll, vertical) {
   this._init(parent, panelToScroll, vertical);
}

ScrollItemsBox.prototype = {
   _init: function(parent, panelToScroll, vertical) {
      this.parent = parent;
      this.idSignalAlloc = 0;
      this.panelToScroll = panelToScroll;
      this.vertical = vertical;
      this.actor = new St.BoxLayout({ vertical: this.vertical });
      this.panelWrapper = new St.BoxLayout({ vertical: this.vertical });
      this.panelWrapper.add_actor(this.panelToScroll);

      this.scroll = this._createScroll(this.vertical);
      this.scroll.add_actor(this.panelWrapper);

      this.actor.add(this.scroll, { x_fill: true, y_fill: true, y_align: St.Align.START, expand: true });
   },

   _createScroll: function(vertical) {
      let scrollBox;
      if(vertical) {
         scrollBox = new St.ScrollView({ x_fill: true, y_fill: false, y_align: St.Align.START, style_class: 'vfade menu-applications-scrollbox' });
         scrollBox.set_policy(Gtk.PolicyType.NEVER, Gtk.PolicyType.AUTOMATIC);
         let vscroll = scrollBox.get_vscroll_bar();
         vscroll.connect('scroll-start',
                          Lang.bind(this, function() {
                          this.parent.menu.passEvents = true;
                       }));
         vscroll.connect('scroll-stop',
                          Lang.bind(this, function() {
                          this.parent.menu.passEvents = false;
                       }));
      } else {
         scrollBox = new St.ScrollView({ x_fill: false, y_fill: true, x_align: St.Align.START, style_class: 'hfade menu-applications-scrollbox' });
         scrollBox.set_policy(Gtk.PolicyType.AUTOMATIC, Gtk.PolicyType.NEVER);
         let hscroll = scrollBox.get_hscroll_bar();
         hscroll.connect('scroll-start',
                          Lang.bind(this, function() {
                          this.parent.menu.passEvents = true;
                       }));
         hscroll.connect('scroll-stop',
                          Lang.bind(this, function() {
                          this.parent.menu.passEvents = false;
                       }));
      }
      return scrollBox;
   },

   _onAllocationChanged: function(actor, event) {
      if(this.visible) {
         let w = this.panelToScroll.get_allocation_box().x2-this.panelToScroll.get_allocation_box().x1
         if((!this.vertical)&&(this.actor.get_width() > w - 10)) {
            this.scroll.get_hscroll_bar().visible = false;
         } else {
            this.scroll.get_hscroll_bar().visible = true;
         }
      }   
   },

//horizontalcode
   _setHorizontalAutoScroll: function(hScroll, setValue) {
      if(hScroll) {
         let childrens = hScroll.get_children();
         if((childrens)&&(childrens[0])&&(!childrens[0].get_vertical())) {
            if(!this.hScrollSignals)
               this.hScrollSignals = new Array();
            let hScrollSignal = this.hScrollSignals[hScroll];
            if(((!hScrollSignal)||(hScrollSignal == 0))&&(setValue)) {
               this.hScrollSignals[hScroll] = hScroll.connect('motion-event', Lang.bind(this, this._onMotionEvent));
            }
            else if((hScrollSignal)&&(hScrollSignal > 0)&&(!setValue)) {
               this.hScrollSignals[hScroll] = null;
               hScroll.disconnect(hScrollSignal);
            }
         }
      }
   },

   _onMotionEvent: function(actor, event) {
      this.hScroll = actor;
      let dMin = 10;
      let dMax = 50;
      let [mx, my] = event.get_coords();
      let [ax, ay] = this.hScroll.get_transformed_position();
      let [ah, aw] = [this.hScroll.get_height(), this.hScroll.get_width()];
      if((my < ay + ah)&&(my > ay)&&((mx < ax + dMin)&&(mx > ax - dMax))||
         ((mx > ax + aw - dMin)&&(mx < ax + aw + dMax)))
         this._doHorizontalScroll();
   },

   _doHorizontalScroll: function() {
      if((this.hScrollSignals)&&(this.hScrollSignals[this.hScroll] > 0)) {
         let dMin = 10;
         let dMax = 50;
         let speed = 1;
         let [mx, my, mask] = global.get_pointer();
         let [ax, ay] = this.hScroll.get_transformed_position();
         let [ah, aw] = [this.hScroll.get_height(), this.hScroll.get_width()];
         if((my < ay + ah)&&(my > ay)) {
            if((mx < ax + dMin)&&(mx > ax - dMax)) {
               if(ax > mx)
                  speed = 20*speed*(ax - mx)/dMax;
               let val = this.hScroll.get_hscroll_bar().get_adjustment().get_value();
               this.hScroll.get_hscroll_bar().get_adjustment().set_value(val - speed);
               Mainloop.timeout_add(100, Lang.bind(this, this._doHorizontalScroll));
            }
            else if((mx > ax + aw - dMin)&&(mx < ax + aw + dMax)) {
               if(ax + aw < mx)
                  speed = 20*speed*(mx - ax - aw)/dMax;
               let val = this.hScroll.get_hscroll_bar().get_adjustment().get_value();
               this.hScroll.get_hscroll_bar().get_adjustment().set_value(val + speed);
               Mainloop.timeout_add(100, Lang.bind(this, this._doHorizontalScroll));
            }
         }
      }
   }, 
//horizontalcode
   setAutoScrolling: function(autoScroll) {
      if(this.vertical)
         this.scroll.set_auto_scrolling(autoScroll);
      else
         this._setHorizontalAutoScroll(this.scroll, autoScroll);
   },

   setScrollVisible: function(visible) {
      this.visible = visible;
      if(this.vertical)
         this.scroll.get_vscroll_bar().visible = visible;
      else {
         if((visible)&&(this.idSignalAlloc == 0))
            this.idSignalAlloc = this.actor.connect('allocation_changed', Lang.bind(this, this._onAllocationChanged));
         else if(this.idSignalAlloc > 0) {
            this.actor.disconnect(this.idSignalAlloc);
            this.idSignalAlloc = 0;
         }
         this.scroll.get_hscroll_bar().visible = visible;
      }
   },

   scrollToActor: function(actor) {
    try {
      if(this.vertical) {
         var current_scroll_value = this.scroll.get_vscroll_bar().get_adjustment().get_value();
         var box_height = this.actor.get_allocation_box().y2-this.actor.get_allocation_box().y1;
         var new_scroll_value = current_scroll_value;
         let hActor = this._getAllocationActor(actor, 0);
         if (current_scroll_value > hActor-10) new_scroll_value = hActor-10;
         if (box_height+current_scroll_value < hActor + actor.get_height()+10) new_scroll_value = hActor + actor.get_height()-box_height+10;
         if (new_scroll_value!=current_scroll_value) this.scroll.get_vscroll_bar().get_adjustment().set_value(new_scroll_value);
   // Main.notify("finish" + new_scroll_value);
      } else {
         var current_scroll_value = this.scroll.get_hscroll_bar().get_adjustment().get_value();
         var box_width = this.actor.get_allocation_box().x2-this.actor.get_allocation_box().x1;
         var new_scroll_value = current_scroll_value;
         if (current_scroll_value > actor.get_allocation_box().x1-10) new_scroll_value = actor.get_allocation_box().x1-10;
         if (box_width+current_scroll_value < actor.get_allocation_box().x2+40) new_scroll_value = actor.get_allocation_box().x2-box_width+40;
         if (new_scroll_value!=current_scroll_value) this.scroll.get_hscroll_bar().get_adjustment().set_value(new_scroll_value);
      }
     } catch(e) {
        Main.notify("ScrollError", e.message);
     }
   },

   _getAllocationActor: function(actor, currHeight) {
      let actorParent = actor.get_parent();
      if((actorParent != null)&&(actorParent != this.parent)) {
         if(actorParent != this.panelToScroll) {
            return this._getAllocationActor(actorParent, currHeight + actor.get_allocation_box().y1);
         } else {
            return currHeight + actor.get_allocation_box().y1;
         }
      }
      return 0;//Some error
   }
};

function DriveMenu(parent, selectedAppBox, hover, place, iconSize, iconVisible) {
   this._init(parent, selectedAppBox, hover, place, iconSize, iconVisible);
}

DriveMenu.prototype = {
   _init: function(parent, selectedAppBox, hover, place, iconSize, iconVisible) {
      this.drive = new DriveMenuItems(parent, place, iconSize, iconVisible);
      this.app = this.drive.app;
      this.selectedAppBox = selectedAppBox;
      this.hover = hover;
      this.actor = new St.BoxLayout({ style_class: 'menu-application-button', vertical: false, reactive: true, track_hover: true });
      this.actor.add_style_class_name('menu-removable-button');
      this.actor.connect('enter-event', Lang.bind(this, this._onKeyFocusIn));
      this.actor.connect('leave-event', Lang.bind(this, this._onKeyFocusOut));
      this.actor.connect('key-focus-in', Lang.bind(this, this._onKeyFocusIn));
      this.actor.connect('key-focus-out', Lang.bind(this, this._onKeyFocusOut));
      this.actor.add(this.drive.actor, { x_align: St.Align.START, y_align: St.Align.MIDDLE, x_fill: true, y_fill: false, expand: true });
      this.actor.add(this.drive.ejectButton, { x_align: St.Align.END, y_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: false });
   },

   _onKeyFocusIn: function(actor) {
      this.setActive(true);
   },

   _onKeyFocusOut: function(actor) {
      this.setActive(false);
   },

   setActive: function(active) {
      if(active) {
         this.actor.set_style_class_name('menu-application-button-selected');
         this.actor.add_style_class_name('menu-removable-button-selected');
         this.selectedAppBox.setSelectedText(this.drive.app.get_name(), this.drive.app.get_description().split("\n")[0]);
         this.hover.refreshApp(this.app);
      }
      else {
         this.actor.set_style_class_name('menu-application-button');
         this.actor.add_style_class_name('menu-removable-button');
         this.selectedAppBox.setSelectedText("", "");
         this.hover.refreshFace();
      }
   },

   setIconVisible: function(iconVisible) {
      this.drive.setIconVisible(iconVisible);
   },

   setIconSize: function(iconSize) {
      this.drive.setIconSize(iconSize);
   }
};

function DriveMenuItems(parent, place, iconSize, iconVisible) {
   this._init(parent, place, iconSize, iconVisible);
}

DriveMenuItems.prototype = {
   __proto__: PopupMenu.PopupBaseMenuItem.prototype,

   _init: function(parent, place, iconSize, iconVisible) {
      PopupMenu.PopupBaseMenuItem.prototype._init.call(this, {hover: false, sensitive: false, focusOnHover: false});

      this.actor.set_style_class_name('');
      this.place = place;
      this.iconSize = iconSize;
      this.parent = parent;

      this._createAppWrapper(this.place);

      this.container = new St.BoxLayout({ vertical: false });

      this.icon = this.place.iconFactory(this.iconSize);
      if(this.icon) { 
         this.container.add(this.icon, { x_align: St.Align.START, y_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: false });
         this.icon.realize();
      }

      this.label = new St.Label({ style_class: 'menu-application-button-label', text: place.name });
      this.container.add(this.label, { x_align: St.Align.START, y_align: St.Align.MIDDLE, x_fill: true, y_fill: false, expand: true });

      let ejectIcon = new St.Icon({ icon_name: 'media-eject', icon_type: St.IconType.SYMBOLIC, style_class: 'popup-menu-icon' });
      this.ejectButton = new St.Button({ style_class: 'menu-eject-button', child: ejectIcon });
      this.ejectButton.connect('clicked', Lang.bind(this, this._eject));
      this.ejectButton.connect('enter-event', Lang.bind(this, this._ejectEnterEvent));
      this.ejectButton.connect('leave-event', Lang.bind(this, this._ejectLeaveEvent));
      this.addActor(this.container);
      this.setIconVisible(iconVisible);
      this.label.realize();
      this.actor._delegate = this;

   },

   _ejectEnterEvent: function(actor, event) {
      global.set_cursor(Cinnamon.Cursor.POINTING_HAND);
      actor.add_style_pseudo_class('hover');
   },

   _ejectLeaveEvent: function(actor, event) {
      actor.remove_style_pseudo_class('hover');
      global.unset_cursor();
   },

   setIconSize: function(iconSize) {
      this.iconSize = iconSize;
      if(this.icon) {
         let visible = this.icon.visible;
         this.container.remove_actor(this.icon);
         this.icon.destroy();
         this.icon = this.place.iconFactory(this.iconSize);
         this.icon.visible = visible;
         this.container.insert_actor(this.icon, 0);
      }
   },

   setIconVisible: function(iconVisible) {
      if(this.icon)
         this.icon.visible = iconVisible;
   },

   _eject: function() {
      this.place.remove();
   },

   activate: function(event) {
      if(event)
         this.place.launch({ timestamp: event.get_time() });
      else
         this.place.launch();
      PopupMenu.PopupBaseMenuItem.prototype.activate.call(this, event);
      this.parent.menu.close();
   },

   _createAppWrapper: function(place) {
      // We need this fake app to help standar works.
      this.app = {
         open_new_window: function(open) {
            place.launch();
         },
         get_description: function() {
            if(place.id.indexOf("bookmark:") == -1)
               return toAscciiFromHex(place.id.slice(13));
            return toAscciiFromHex(place.id.slice(16));
         },
         get_name: function() {
            return toAscciiFromHex(place.name);
         },
         create_icon_texture: function(appIconSize) {
            return place.iconFactory(appIconSize);
         }
      };
      return this.app;
   }
};

function GnoMenuBox(parent, hoverIcon, selectedAppBox, powerPanel, verticalPanel, iconSize, callBackFun) {
   this._init(parent, hoverIcon, selectedAppBox, powerPanel, verticalPanel, iconSize, callBackFun);
}

GnoMenuBox.prototype = {
   _init: function(parent, hoverIcon, selectedAppBox, powerPanel, verticalPanel, iconSize, callBackFun) {
      this.actor = new St.BoxLayout({ vertical: verticalPanel, reactive: true, track_hover: true });
      this.hoverBox = new St.BoxLayout({ vertical: false });
      this.powerBox = new St.BoxLayout({ vertical: verticalPanel });
      this.actor.add_actor(this.hoverBox);
      this.itemsBox = new St.BoxLayout({ vertical: verticalPanel });
      this.scrollActor = new ScrollItemsBox(parent, this.itemsBox, verticalPanel);
      //this.spacerTop = new SeparatorBox(false, 20);
      //this.actor.add_actor(this.spacerTop.actor);
      this.actor.add(this.scrollActor.actor, { x_fill: true, y_fill: true, expand: false});
      this.actor.add(this.powerBox, { x_fill: true, y_fill: true, expand: true });
      this.actor._delegate = this;
      this._gnoMenuSelected = 0;
      this.parent = parent;
      this.hover = hoverIcon;
      this.selectedAppBox = selectedAppBox;
      this.powerPanel = powerPanel;
      this.vertical = verticalPanel;
      this.iconSize = iconSize;
      this.iconsVisible = true;
      this.callBackFun = callBackFun;
      this.takePower(true);
      this._createActionButtons();
      this._onEnterEvent(this._actionButtons[this._gnoMenuSelected].actor);
      this._insertButtons(St.Align.MIDDLE);
      this.actor.connect('key-focus-in', Lang.bind(this, function(actor, event) {
         if((this._actionButtons.length > 0)&&(this._gnoMenuSelected == -1)) {
            this._gnoMenuSelected = 0;
            this._onEnterEvent(this._actionButtons[this._gnoMenuSelected].actor);
         }
      }));
      this.actor.connect('key-focus-out', Lang.bind(this, function(actor, event) {
         this.disableSelected();
      }));
   },
   
   _createActionButtons: function() {
      this._actionButtons = new Array();
      let button = new SystemButton(this.parent, null, "emblem-favorite", _("Favorites"), _("Favorites"), this.hover, this.iconSize, true);
      button.actor.connect('enter-event', Lang.bind(this, this._onEnterEvent));
      button.actor.connect('leave-event', Lang.bind(this, this._onLeaveEvent));
      //button.setAction(Lang.bind(this, this._changeSelectedButton));
      this.favorites = button;
      this._actionButtons.push(button);
        
      //Logout button  //preferences-other  //emblem-package
      button = new SystemButton(this.parent, null, "preferences-other", _("All Applications"), _("All Applications"), this.hover, this.iconSize, true);
      button.actor.connect('enter-event', Lang.bind(this, this._onEnterEvent));
      button.actor.connect('leave-event', Lang.bind(this, this._onLeaveEvent));
      //button.setAction(Lang.bind(this, this._changeSelectedButton));
      this.appList = button;
      this._actionButtons.push(button);

      //Shutdown button
      button = new SystemButton(this.parent, null, "folder", _("Places"), _("Places"), this.hover, this.iconSize, true);
      button.actor.connect('enter-event', Lang.bind(this, this._onEnterEvent));
      button.actor.connect('leave-event', Lang.bind(this, this._onLeaveEvent)); 
      //button.setAction(Lang.bind(this, this._changeSelectedButton));
      this.places = button;
      this._actionButtons.push(button);

      //Shutdown button
      button = new SystemButton(this.parent, null, "folder-recent", _("Recent Files"), _("Recent Files"), this.hover, this.iconSize, false);       
      button.actor.connect('enter-event', Lang.bind(this, this._onEnterEvent));
      button.actor.connect('leave-event', Lang.bind(this, this._onLeaveEvent)); 
      //button.setAction(Lang.bind(this, this._changeSelectedButton));
      this.recents = button;
      this._actionButtons.push(button);
   },

   refresh: function() {
      this.setTheme(this.theme);
   },

   _insertButtons: function() {
      let xAling, yAling;
      switch(this.parent.styleGnoMenuPanel.style_class) {
         case 'menu-gno-operative-box-left':
              xAling = St.Align.END;
              yAling = St.Align.END;
              break;
         case 'menu-gno-operative-box-right':
              xAling = St.Align.START;
              yAling = St.Align.END;
              break;
         case 'menu-gno-operative-box-top':
              xAling = St.Align.START;
              yAling = St.Align.END;
              break;
         case 'menu-gno-operative-box-bottom':
              xAling = St.Align.START;
              yAling = St.Align.START;
              break;
      }
      for(let i = 0; i < this._actionButtons.length; i++) {
         this.itemsBox.add(this._actionButtons[i].actor, { x_fill: false, y_fill: false, x_align: xAling, y_align: yAling, expand: true });
         this._setStyleActive(this._actionButtons[i], false);
      }
      this._setStyleActive(this.favorites, true);
   },

   _removeButtons: function() {
      for(let i = 0; i < this._actionButtons.length; i++) {
         parentBtt = this._actionButtons[i].actor.get_parent();
         if(parentBtt)
            parentBtt.remove_actor(this._actionButtons[i].actor);
      }
      this.itemsBox.destroy_all_children();
   },

   setTheme: function(theme) {
      this.theme = theme;
      this._removeButtons();
      switch(theme) {
         case "icon":
            this._setVerticalButtons(false);
            this._insertButtons();
            this._setTextVisible(false);
            this._setIconsVisible(true);
            break;
         case "text":
            this._setVerticalButtons(true);
            this._insertButtons();
            this._setTextVisible(true);
            this._setIconsVisible(false);
            break;
         case "list":
            this._setVerticalButtons(false);
            this._insertButtons();
            this._setTextVisible(true);
            this._setIconsVisible(true);
            break;
         case "grid":
            this._setVerticalButtons(true);
            this._insertButtons();
            this._setTextVisible(true);
            this._setIconsVisible(true);
            break;
      }
   },

   _setIconsVisible: function(visibleIcon) {
      for(let i = 0; i < this._actionButtons.length; i++) {
         this._actionButtons[i].setIconVisible(visibleIcon);
      }
   },

   _setTextVisible: function(visibleText) {
      for(let i = 0; i < this._actionButtons.length; i++) {
         this._actionButtons[i].setTextVisible(visibleText);
      }
   },

   _setVerticalButtons: function(vertical) {
      for(let i = 0; i < this._actionButtons.length; i++) {
         this._actionButtons[i].setVertical(vertical);
      }
   },

   disableSelected: function() {
      this._gnoMenuSelected = 0;
      this._onEnterEvent(this._actionButtons[0].actor);
   },

   getSelected: function() {
      return this._actionButtons[this._gnoMenuSelected];
   },

   setSelected: function(selected) {
      this._gnoMenuSelected = -1;
      for(let i = 0; i < this._actionButtons.length; i++) {
         if(this._actionButtons[i].title == selected) {
            this._gnoMenuSelected = i;
            break;
         }
      }
      if(this._gnoMenuSelected != -1)
         this._onEnterEvent(this._actionButtons[this._gnoMenuSelected].actor);
   },

   _onEnterEvent: function(actor) {
      this._gnoMenuSelected = -1;
      for(let i = 0; i < this._actionButtons.length; i++) {
         if(this._actionButtons[i].actor == actor) {
            this._gnoMenuSelected = i;
         } else {
            this._setStyleActive(this._actionButtons[i], false);
         }
      }
      if(this._gnoMenuSelected != -1) {
         this._setStyleActive(this._actionButtons[this._gnoMenuSelected], true);
         this.callBackFun(this._actionButtons[this._gnoMenuSelected].title);

      }
   },

   _setStyleActive: function(button, active) {
      let selected = '';
      if(active)
         selected = '-selected';
      button.setActive(active);
      switch(this.parent.styleGnoMenuPanel.style_class) {
         case 'menu-gno-operative-box-left':
              button.actor.add_style_class_name('menu-gno-button-left' + selected);
              break;
         case 'menu-gno-operative-box-right':
              button.actor.add_style_class_name('menu-gno-button-right' + selected);
              break;
         case 'menu-gno-operative-box-top':
              button.actor.add_style_class_name('menu-gno-button-top' + selected);
              break;
         case 'menu-gno-operative-box-bottom':
              button.actor.add_style_class_name('menu-gno-button-bottom' + selected);
              break;
      }
   },

   _onLeaveEvent: function(actor) {
      //this._onEnterEvent(null)
      //this.actor.add_style_class_name('menu-gno-button');
   },

   showFavorites: function(showFavorites) {
      this.favorites.actor.visible = showFavorites;
   },

   showPlaces: function(showPlaces) {
      this.places.actor.visible = showPlaces;
   },

   showRecents: function(showRecent) {
      this.recents.actor.visible = showRecent;
   },

   takeHover: function(take) {
      let parent = this.hover.container.get_parent();
      if(parent) {
         parent.remove_actor(this.hover.container);
      }
      if(take) {
         this.hoverBox.add(this.hover.container, { x_fill: false, x_align: St.Align.MIDDLE, expand: true });
      }
   },

   takePower: function(take) {
      if((take)&&(this.powerBox.get_children().indexOf(this.powerPanel.actor) == -1)) {
         switch(this.parent.styleGnoMenuPanel.style_class) {
            case 'menu-gno-operative-box-left':
                   this.powerBox.set_style_class_name('menu-gno-system-left');
                   break;
            case 'menu-gno-operative-box-right':
                   this.powerBox.set_style_class_name('menu-gno-system-right');
                   break;
            case 'menu-gno-operative-box-top':
                   this.powerBox.set_style_class_name('menu-gno-system-top');
                   break;
            case 'menu-gno-operative-box-bottom':
                   this.powerBox.set_style_class_name('menu-gno-system-bottom');
                   break;
         }
         if(this.powerBox.get_vertical())
            this.powerBox.add(this.powerPanel.actor, { x_fill: false, y_fill: false, x_align: St.Align.MIDDLE, y_align: St.Align.END, expand: true });
         else
            this.powerBox.add(this.powerPanel.actor, { x_fill: false, y_fill: false, x_align: St.Align.END, y_align: St.Align.MIDDLE, expand: true });
      }
      else if(this.powerPanel.actor.get_parent() == this.actor) {
         this.powerBox.remove_actor(this.powerPanel.actor);
      }
   },

   setIconSize: function (iconSize) {
      this.iconSize = iconSize;
      for(let i = 0; i < this._actionButtons.length; i++) {
         this._actionButtons[i].setIconSize(iconSize);
      }
   },

   setAutoScrolling: function(autoScroll) {
      this.scrollActor.setAutoScrolling(autoScroll);
   },

   setScrollVisible: function(visible) {
      this.scrollActor.setScrollVisible(visible);
   },

   setSpecialColor: function(specialColor) {
      if(specialColor) {
         this.actor.set_style_class_name('menu-favorites-box');
         this.actor.add_style_class_name('menu-gno-box');
      }
      else {
         this.actor.set_style_class_name('');
      }
   },

   navegateGnoMenuBox: function(symbol, actor) {
      if((this._gnoMenuSelected != -1)&&(this._gnoMenuSelected < this._actionButtons.length)) {
         let changerPos = this._gnoMenuSelected;
         this.disableSelected();
         if((symbol == Clutter.KEY_Up) || (symbol == Clutter.KEY_Left)) {
            if(changerPos - 1 < 0)
               this._gnoMenuSelected = this._actionButtons.length - 1;
            else
               this._gnoMenuSelected = changerPos - 1;
         }
         else if((symbol == Clutter.KEY_Down) || (symbol == Clutter.KEY_Right)) {
            if(changerPos + 1 < this._actionButtons.length)
               this._gnoMenuSelected = changerPos + 1;
            else
               this._gnoMenuSelected = 0;
         } else if((symbol == Clutter.KEY_Return) || (symbol == Clutter.KP_Enter)) {
            this.executeButtonAction(changerPos);
         }

      } else if(this._actionButtons.length > 0) {
         this._gnoMenuSelected = 0;
      }
      this.scrollActor.scrollToActor(this._actionButtons[this._gnoMenuSelected].actor);
      this._onEnterEvent(this._actionButtons[this._gnoMenuSelected].actor);
      return true;
   }
};

function AccessibleBox(parent, hoverIcon, selectedAppBox, controlBox, powerBox, vertical, iconSize, showRemovable) {
   this._init(parent, hoverIcon, selectedAppBox, controlBox, powerBox, vertical, iconSize, showRemovable);
}

AccessibleBox.prototype = {
   _init: function(parent, hoverIcon, selectedAppBox, controlBox, powerBox, vertical, iconSize, showRemovable) {
      this.actor = new St.BoxLayout({ vertical: true });
      this.internalBox = new St.BoxLayout({ style_class: 'menu-accessible-panel', vertical: true });
      this.actor.add(this.internalBox, { y_fill: true, expand: true });
      
      this.placeName = new St.Label({ style_class: 'menu-selected-app-title', text: _("Places"), visible: false });
      this.systemName = new St.Label({ style_class: 'menu-selected-app-title', text: _("System"), visible: false });
      this.placeName.style="font-size: " + 10 + "pt";
      this.systemName.style="font-size: " + 10 + "pt";
      this.hoverBox = new St.BoxLayout({ vertical: false });
      this.internalBox.add_actor(this.hoverBox);
      this.controlBox = new St.BoxLayout({ vertical: false });
      this.internalBox.add_actor(this.controlBox);
      this.itemsBox = new St.BoxLayout({ vertical: true });
      this.itemsDevices = new St.BoxLayout({ style_class: 'menu-accessible-devices-box', vertical: true });
      this.itemsPlaces = new AccessibleDropBox(parent, true).actor;
      this.itemsPlaces.set_style_class_name('menu-accessible-places-box');
      this.itemsSystem = new AccessibleDropBox(parent, false).actor;
      this.itemsSystem.set_style_class_name('menu-accessible-system-box');
      this.itemsBox.add_actor(this.placeName);
      this.itemsBox.add_actor(this.itemsPlaces);
      this.itemsBox.add_actor(this.itemsDevices);
      this.powerBoxItem = new St.BoxLayout({ vertical: true });
      this.spacerMiddle = new SeparatorBox(false, 20);// St.BoxLayout({ vertical: false, height: 20 });
      this.itemsBox.add_actor(this.spacerMiddle.actor);
      this.itemsBox.add_actor(this.systemName);
      this.itemsBox.add_actor(this.itemsSystem);
      this.scrollActor = new ScrollItemsBox(parent, this.itemsBox, true);
      this.spacerTop = new SeparatorBox(false, 20);//St.BoxLayout({ vertical: false, height: 20 });
      this.internalBox.add_actor(this.spacerTop.actor);
      this.internalBox.add(this.scrollActor.actor, { y_fill: true, expand: true });
      this.internalBox.add(this.powerBoxItem, { y_fill: true, expand: true });
      this.actor._delegate = this;

      this.showRemovable = showRemovable;
      this.idSignalRemovable = 0;
      this._staticSelected = -1;
      this.parent = parent;
      this.hover = hoverIcon;
      this.selectedAppBox = selectedAppBox;
      this.control = controlBox;
      this.powerBox = powerBox;
      this.vertical = vertical;
      this.iconSize = iconSize;
      this.iconsVisible = true;
      this.takingHover = false;
      this.takeHover(true);
      this.takeControl(true);
      this.takePower(true);

      this.refreshAccessibleItems();

      this.actor.connect('key-focus-in', Lang.bind(this, function(actor, event) {
         if((this._staticButtons.length > 0)&&(this._staticSelected == -1))
            this._staticSelected = 0;
         this.activeSelected();
      }));
      this.actor.connect('key-focus-out', Lang.bind(this, function(actor, event) {
         this.disableSelected();
      }));
   },

   updateVisibility: function() {
      this.hoverBox.visible = this.hover.actor.visible;
      if((!this.hover.actor.visible)&&(!this.control.actor.visible)) {
          this.spacerTop.actor.visible = false;
      } else {
          this.spacerTop.actor.visible = true;
      }
   },

   initItemsRemovables: function() {
      let any = false;
      if(this.showRemovable) {
         try {
            let mounts = Main.placesManager.getMounts();

            let drive;
            for(let i = 0; i < mounts.length; i++) {
               if(mounts[i].isRemovable()) {
                  drive = new DriveMenu(this.parent, this.selectedAppBox, this.hover, mounts[i], this.iconSize, this.iconsVisible);
                  //drive.container.set_width(this.actor.get_width()-40);
                  this.itemsDevices.add_actor(drive.actor);
                  this._staticButtons.push(drive);
                  any = true;
               }
            }
         } catch(e) {
            global.logError(e);
            Main.notify("ErrorDevice:", e.message);
         }
         if(this.idSignalRemovable == 0)
            this.idSignalRemovable = Main.placesManager.connect('mounts-updated', Lang.bind(this, this.refreshAccessibleItems));
      } else {
         if(this.idSignalRemovable > 0) {
            Main.placesManager.disconnect(this.idSignalRemovable);
            this.idSignalRemovable = 0;
         }
      }
      this.itemsDevices.visible = any;
   },

   showRemovableDrives: function(showRemovable) {
      if(this.showRemovable != showRemovable) {
         this.showRemovable = showRemovable;
         this.refreshAccessibleItems();
      }
   },

   setSeparatorSpace: function(space) {
      this.spacerMiddle.setSpace(space);
      this.spacerTop.setSpace(space);
   },

   setSeparatorLine: function(haveLine) {
      this.spacerMiddle.setLineVisible(haveLine);
      this.spacerTop.setLineVisible(haveLine);
   },

   setNamesVisible: function(visible) {
      this.placeName.visible = true;
      this.systemName.visible = true;
   },

   setIconsVisible: function(visible) {
      this.iconsVisible = visible;
      for(let i = 0; i < this._staticButtons.length; i++) {
         this._staticButtons[i].setIconVisible(visible);
      }
   },

   setSpecialColor: function(specialColor) {
      if(specialColor) {
         this.actor.set_style_class_name('menu-favorites-box');
         this.actor.add_style_class_name('menu-accessible-box');
      }
      else
         this.actor.set_style_class_name('');
   },

   acceptDrop: function(source, actor, x, y, time) {
      if(source instanceof FavoritesButtonExtended) {
         source.actor.destroy();
         actor.destroy();
         AppFavorites.getAppFavorites().removeFavorite(source.app.get_id());
         return true;
      }
      return false;
   },

   closeContextMenus: function(excludeApp, animate) {
      for(var app in this._staticButtons) {
         if((app!=excludeApp)&&(this._staticButtons[app].menu)&&(this._staticButtons[app].menu.isOpen)) {
            if(animate)
               this._staticButtons[app].toggleMenu();
            else
               this._staticButtons[app].closeMenu();

         }
      }
   },

   takeHover: function(take) {
      let parent = this.hover.container.get_parent();
      if(parent) {
         parent.remove_actor(this.hover.container);
      }
      if(take) {
         this.hoverBox.add(this.hover.container, { x_fill: false, x_align: St.Align.MIDDLE, expand: true });
         this.hoverBox.set_style("padding-top: 10px; padding-bottom: 10px;");
      } else {
         this.hoverBox.set_style("padding-top: 0px; padding-bottom: 0px;");
      }
      this.hoverBox.visible = take;
   },

   takeControl: function(take) {
      if(take) {
         this.controlBox.add(this.control.actor, { x_fill: true, x_align: St.Align.MIDDLE, expand: true });
      }
      else if(this.control.actor.get_parent() == this.controlBox) {
         this.controlBox.remove_actor(this.control.actor);
      }
   },

   takePower: function(take) {
      if(take) {
         if(this.powerBoxItem.get_children().indexOf(this.powerBox.actor) == -1)
            this.powerBoxItem.add(this.powerBox.actor, { x_fill: true, y_fill: false, x_align: St.Align.MIDDLE, y_align: St.Align.END, expand: true });
      }
      else if(this.powerBox.actor.get_parent() == this.powerBoxItem) {
         this.powerBoxItem.remove_actor(this.powerBox.actor);
      }
   },

   setAutoScrolling: function(autoScroll) {
      this.scrollActor.setAutoScrolling(autoScroll);
   },

   setScrollVisible: function(visible) {
      this.scrollActor.setScrollVisible(visible);
   },

   getFirstElement: function() {
      let childrens = this.internalBox.get_children();
      if(childrens.length > 0) {
         return childrens[0];
      }
      return null;
   },

   getBookmarkById: function(listBookmarks, id) {
      for(let i = 0; i < listBookmarks.length; i++) {
         if(listBookmarks[i].id == id) {
            return listBookmarks[i];
         }
      }
      return null;
   },

   refreshAccessibleItems: function() {
      if(this._staticButtons) {
         for(let i = 0; i < this._staticButtons.length; i++) {
            this._staticButtons[i].actor.destroy();
         }
         this.itemsPlaces.destroy_all_children();
         this.itemsSystem.destroy_all_children();
         this.itemsDevices.destroy_all_children();
      }
      this._staticButtons = new Array();
      this.initItemsPlaces();
      this.initItemsRemovables();
      this.initItemsSystem();
      this.setIconsVisible(this.iconsVisible);
      this.parent._updateSize();
   },

   initItemsPlaces: function() {
     try {
      let listBookmarks = this.parent._listBookmarks();
      let placesList = this.parent.getPlacesList();
      let placesName = this.parent.getPlacesNamesList();
      let currBookmark, item;
      for(let i = 0; i < placesList.length; i++) {
         if(placesList[i] != "") {
            currBookmark = this.getBookmarkById(listBookmarks, placesList[i]);
            item = new PlaceButtonAccessibleExtended(this.parent, this.scrollActor, currBookmark, placesName[placesList[i]], false,
                                                     this.iconSize, this.textButtonWidth, this.appButtonDescription);
            item.actor.connect('enter-event', Lang.bind(this, this._appEnterEvent, item));
            item.connect('enter-event', Lang.bind(this, this._appEnterEvent, item));
            item.actor.connect('leave-event', Lang.bind(this, this._appLeaveEvent, item));
            this.itemsPlaces.add_actor(item.actor);
            //if(item.menu)
               this.itemsPlaces.add_actor(item.menu.actor);
            /*else {//Remplace menu actor by a hide false actor.
               falseActor = new St.BoxLayout();
               falseActor.hide();
               this.itemsPlaces.add_actor(falseActor);
            }*/
            this._staticButtons.push(item);
         }
      }
    } catch(e) {
      Main.notify("Errttt", e.message);
    }
   },

   initItemsSystem: function() {
      let appSys = Cinnamon.AppSystem.get_default();
      let appsList = this.parent.getAppsList();
      for(let i = 0; i < appsList.length; i++) {
         if(appsList[i] != "") {
            this._createApp(appSys, appsList[i]);
         }
      }
   },

   setIconSize: function (iconSize) {
      this.iconSize = iconSize;
      for(let i = 0; i < this._staticButtons.length; i++) {
         this._staticButtons[i].setIconSize(iconSize);
      }
   },

   _createApp: function(appSys, appName) {
      let iconSizeDrag = 32;
      let app = appSys.lookup_app(appName);
      let appsName = this.parent.getAppsNamesList();
      if(app) {
         //Main.notify("Fue:" + appsName[app.get_id()]);
         let item = new FavoritesButtonExtended(this.parent, this.scrollActor, this.vertical, true, app, appsName[app.get_id()],
                                                4, this.iconSize, true, this.textButtonWidth, this.appButtonDescription);
         item.actor.connect('enter-event', Lang.bind(this, this._appEnterEvent, item));
         item.connect('enter-event', Lang.bind(this, this._appEnterEvent, item));
         item.actor.connect('leave-event', Lang.bind(this, this._appLeaveEvent, item));
         this.itemsSystem.add_actor(item.actor);
         //if(item.menu)
            this.itemsSystem.add_actor(item.menu.actor);
         /*else {//Remplace menu actor by a hide false actor.
            falseActor = new St.BoxLayout();
            falseActor.hide();
            this.itemsSystem.add_actor(falseActor);
         }*/
         this._staticButtons.push(item);
      }
   },

   disableSelected: function() {
      if((this._staticSelected != -1)&&(this._staticSelected < this._staticButtons.length)) {
         let selectedBtt = this._staticButtons[this._staticSelected];
         if(!(selectedBtt instanceof FavoritesButtonExtended))
            selectedBtt.actor.style_class = "menu-application-button";
         else
            selectedBtt.actor.remove_style_pseudo_class('active');
      }
      this.selectedAppBox.setSelectedText("", "");
      this.hover.refreshFace();
   },

   activeSelected: function() {
      if((this._staticSelected != -1)&&(this._staticSelected < this._staticButtons.length)) {
         let selectedBtt = this._staticButtons[this._staticSelected];
         if(!(selectedBtt instanceof FavoritesButtonExtended))
            selectedBtt.actor.style_class = "menu-application-button-selected";
         else
            selectedBtt.actor.add_style_pseudo_class('active');
         if(selectedBtt.app.get_description())
            this.selectedAppBox.setSelectedText(selectedBtt.app.get_name(), selectedBtt.app.get_description().split("\n")[0]);
         else
            this.selectedAppBox.setSelectedText(selectedBtt.app.get_name(), "");
         this.hover.refreshApp(selectedBtt.app);
      } else {
         this.selectedAppBox.setSelectedText("", "");
         this.hover.refreshFace();
         this._staticSelected = -1;
      }
   },

   executeButtonAction: function(buttonIndex) {
      if((buttonIndex != -1)&&(buttonIndex < this._staticButtons.length)) {
         this._staticButtons[buttonIndex].actor._delegate.activate();
      }
   },

   navegateAccessibleBox: function(symbol, actor) {
      if((this._staticSelected != -1)&&(this._staticSelected < this._staticButtons.length)) {
         let changerPos = this._staticSelected;
         this.disableSelected();
         if((symbol == Clutter.KEY_Up) || (symbol == Clutter.KEY_Left)) {
            if(changerPos - 1 < 0)
               this._staticSelected = this._staticButtons.length - 1;
            else
               this._staticSelected = changerPos - 1;
         }
         else if((symbol == Clutter.KEY_Down) || (symbol == Clutter.KEY_Right)) {
            if(changerPos + 1 < this._staticButtons.length)
               this._staticSelected = changerPos + 1;
            else
               this._staticSelected = 0;
         } else if((symbol == Clutter.KEY_Return) || (symbol == Clutter.KP_Enter)) {
            this.executeButtonAction(changerPos);
         }

      } else if(this._staticButtons.length > 0) {
         this._staticSelected = 0;
      }
      this.scrollActor.scrollToActor(this._staticButtons[this._staticSelected].actor);
      this.activeSelected();
      return true;
   },

   _appEnterEvent: function(actor, event, applicationButton) {
      this.disableSelected();
      this._staticSelected = this._staticButtons.indexOf(applicationButton);
      this.activeSelected();
   },

   _appLeaveEvent: function(actor, event, applicationButton) {
      this.disableSelected();
   }
};

function SeparatorBox(haveLine, space) {
   this._init(haveLine, space);
}

SeparatorBox.prototype = {
   _init: function(haveLine, space) {
      this.actor = new St.BoxLayout({ vertical: true });
      this.separatorLine = new PopupMenu.PopupSeparatorMenuItem();
      this.actor.add_actor(this.separatorLine.actor);
      this.setLineVisible(haveLine);
      this.setSpace(space);
   },

   setSpace: function(space) {
      this.space = space;
      if(this.actor.get_vertical()) {
         this.actor.set_width(-1);
         this.actor.set_height(space);
      } else {
         this.actor.set_width(space);
         this.actor.set_height(-1);
      }
   },

   setLineVisible: function(show) {
      this.haveLine = show;
      this.separatorLine.actor.visible = show;
   }
};

function SelectedAppBox(parent, activeDateTime) {
   this._init(parent, activeDateTime);
}

SelectedAppBox.prototype = {
   _init: function(parent, activeDateTime) {
      this.dateFormat = "%A,%e %B";
      this.timeFormat = "%H:%M";
      this.appDescriptionSize = 6;
      this.appTitleSize = 15;
      this.timeout = 0;
      this.actor = new St.BoxLayout({ style_class: 'menu-selected-app-box', vertical: true });
      this.appTitle = new St.Label({ style_class: 'menu-selected-app-title', text: "" });
      this.appDescription = new St.Label({ style_class: 'menu-selected-app-description', text: "" });
      this.actor.add_actor(this.appTitle);
      this.actor.add_actor(this.appDescription);
     // this.setAlign(St.Align.START);
      this.setDateTimeVisible(activeDateTime);
   },

   setAlign: function(align) {
      if(align == St.Align.START) {
         this.actor.set_style("text-align: left");
      } else if(align == St.Align.END) {
         this.actor.set_style("text-align: right");
      } else if(align == St.Align.MIDDLE) {
         this.actor.set_style("text-align: center");
      }
      if(this.appTitle.get_parent() == this.actor)
         this.actor.remove_actor(this.appTitle);
      if(this.appDescription.get_parent() == this.actor)
         this.actor.remove_actor(this.appDescription);
      this.actor.add(this.appTitle, {x_fill: true, x_align: align });
      this.actor.add(this.appDescription, {x_fill: true, x_align: align });
   },

   setTitleVisible: function(show) {
      this.appTitle.visible = show;
   },

   setDescriptionVisible: function(show) {
      this.appDescription.visible = show;
   },

   setTitleSize: function(size) {
      this.appTitleSize = size;
      this.appTitle.style="font-size: " + this.appTitleSize + "pt";
   },

   setDescriptionSize: function(size) {
      this.appDescriptionSize = size;
      this.appDescription.style="font-size: " + this.appDescriptionSize + "pt";
   },

   setDateFormat: function(format) {
      this.dateFormat = format;
   },

   setTimeFormat: function(format) {
      this.timeFormat = format;
   },

   setDateTimeVisible: function(visible) {
      try {
      this.activeDateTime = visible;
      this.appTitle.set_text("");
      this.appDescription.set_text("");
      if((!this.activeDateTime)&&(this.timeout > 0)) {
         Mainloop.source_remove(this.timeout);
         this.timeout = 0;
      }
      else if((this.activeDateTime)&&(this.timeout == 0)&&(this.appTitle.get_text() == "")&&(this.appDescription.get_text() == "")) {
         this.timeout = 1;
         this._refrech();
      }
      } catch(e) {Main.notify("listo", e.message);}
   },

   setSelectedText: function(title, description) {
      this.appTitle.set_text(title);
      this.appDescription.set_text(description);
      if((this.activeDateTime)&&(this.timeout == 0)&&(title == "")&&(description == "")) {
         this.timeout = 1;
         this._refrech();
      }
      else {
         if(this.timeout > 0) {
            Mainloop.source_remove(this.timeout);
            this.timeout = 0;
         }
      }
   },

   _refrech: function() {
      if(this.timeout > 0) {
         let displayDate = new Date();
         this.appTitle.set_text(displayDate.toLocaleFormat(this.timeFormat));
         this.appDescription.set_text(displayDate.toLocaleFormat(this.dateFormat));
         this.timeout = Mainloop.timeout_add_seconds(1, Lang.bind(this, this._refrech));
      }
   }
};

function ButtonChangerBox(parent, icon, iconSize, labels, selected, callBackOnSelectedChange) {
    this._init(parent, icon, iconSize, labels, selected, callBackOnSelectedChange);
}

ButtonChangerBox.prototype = {
    __proto__: PopupMenu.PopupSubMenuMenuItem.prototype,

    _init: function (parent, icon, iconSize, labels, selected, callBackOnSelectedChange) {
        PopupMenu.PopupSubMenuMenuItem.prototype._init.call(this, labels[selected]);

        this.visible = true;
        this.actor.set_style_class_name('');
        this.actor.reactive = true;
        this.box = new St.BoxLayout({ style_class: 'menu-category-button', reactive: true, track_hover: true });
        this.box.set_style("padding-right: 4px; padding-left: 4px; padding-top: 4px; padding-bottom: 4px");
        this.parent = parent;
        this.labels = labels;
        this.selected = selected;
        this.callBackOnSelectedChange = callBackOnSelectedChange;
        if(this.label.get_parent() == this.actor)
           this.removeActor(this.label);
        this.label.set_style_class_name('menu-selected-app-title');
        
        let parentT = this._triangle.get_parent();
        if(parentT == this.actor) this.removeActor(this._triangle);
        else if(parentT != null) parentT.remove_actor(this._triangle);
        //this._triangle = new St.Label();
        
        this.icon = new St.Icon({ style_class: 'popup-menu-icon', icon_type: St.IconType.FULLCOLOR, icon_name: icon, icon_size: iconSize });
        this.label.realize();
	this.box.add(this.label, {x_fill: false, y_fill: false, x_align: St.Align.MIDDLE, y_align: St.Align.MIDDLE });
        if(this.icon) {
	   this.box.add(this.icon, {x_fill: false, y_fill: false, x_align: St.Align.MIDDLE, y_align: St.Align.MIDDLE });
           this.icon.realize();
        }
        this.addActor(this.box);
        this.box.connect('enter-event', Lang.bind(this, function() {
           this.setActive(true);
        }));
        this.box.connect('leave-event', Lang.bind(this, function() {
           this.setActive(false); 
        }));
    },

    setIconSize: function(iconSize) {
      if(this.icon)
         this.icon.set_icon_size(iconSize);
    },

    setTextVisible: function(visible) {
       this.label.visible = visible;
    },

    setActive: function(active) {
       if(this.active != active) {
          this.active = active;
          if(!this.parent.actorResize) {
             if(active) {
                global.set_cursor(Cinnamon.Cursor.POINTING_HAND);
                this.box.set_style_class_name('menu-category-button-selected');
             }
             else {
                global.unset_cursor();
                this.box.set_style_class_name('menu-category-button');
             }
          }
          this.emit('active-changed', active);
       }
    },
 
    _onButtonReleaseEvent: function(actor, event) {
       if(event.get_button() == 1) {
          this.setActive(false);
          this.activateNext();
          Mainloop.idle_add(Lang.bind(this, function() {
             let [mx, my] = event.get_coords();
             let [ax, ay] = actor.get_transformed_position();
             aw = actor.get_width();
             ah = actor.get_height();
             if((mx > ax)&&(mx < ax + aw)&&(my > ay)&&(my < ay + ah))
                this.setActive(true);
          }));
        }
        PopupMenu.PopupSubMenuMenuItem.prototype._onButtonReleaseEvent.call(actor, event);
    },

    activateNext: function() {
       if(this.selected >= this.labels.length - 1)
          this.selected = 0;
       else
          this.selected ++;
       this.activateIndex(this.selected);
    },

    getSelected: function() {
       return this.labels[this.selected];
    },

    activateSelected: function(selected) {
       let index = this.labels.indexOf(selected);
       if((index != -1)&&(index != this.selected)) {
          this.activateIndex(index);
       }
    },

    activateIndex: function(index) {
       this.selected = index;
       this.label.set_text(this.labels[this.selected]);
       if(this.callBackOnSelectedChange) {
          this.callBackOnSelectedChange(this.labels[this.selected]);
       }
    }
};

function PowerBox(parent, theme, iconSize, hover, selectedAppBox) {
   this._init(parent, theme, iconSize, hover, selectedAppBox);
}

PowerBox.prototype = {
   _init: function(parent, theme, iconSize, hover, selectedAppBox) {
      this.parent = parent;
      this.iconSize = iconSize;
      this.signalKeyPowerID = 0;
      this._session = new GnomeSession.SessionManager();
      this.selectedAppBox = selectedAppBox;
      this.hover = hover;
      this.powerSelected = 0;
      this.actor = new St.BoxLayout();
      //this.actor.style = "padding-left: "+(10)+"px;padding-right: "+(10)+"px;margin:auto;";
      this._powerButtons = new Array();
      this.actor.connect('key-focus-in', Lang.bind(this, function(actor, event) {        
         if(this._powerButtons.length > 0) {
            if((!this.powerSelected)||(this.powerSelected == -1))
               this.powerSelected = 0;
            if(this.activeBar)
               this.powerSelected = 2;
            this._powerButtons[this.powerSelected].setActive(true);
            if(this.signalKeyPowerID == 0)
               this.signalKeyPowerID = this.actor.connect('key-press-event', Lang.bind(this.parent, this.parent._onMenuKeyPress));
         }
      }));
      this.actor.connect('key-focus-out', Lang.bind(this, function(actor, event) {
         for(let cSys in this._powerButtons)
            this._systemButton[cSys].setActive(false);
         if(this.signalKeyPowerID > 0)
            this.actor.disconnect(this.signalKeyPowerID);
         this.powerSelected = -1;
         this.bttChanger.setActive(false);
      }));
      this.spacerPower = new SeparatorBox(false, 0);
      //Lock screen
      let button = new SystemButton(this.parent, null, "gnome-lockscreen", _("Lock screen"), _("Lock the screen"), this.hover, this.iconSize, false);
      button.actor.connect('enter-event', Lang.bind(this, this._onEnterEvent));
      button.actor.connect('leave-event', Lang.bind(this, this._onLeaveEvent));
      button.setAction(Lang.bind(this, this._onLockScreenAction));

      this._powerButtons.push(button);
        
      //Logout button
      button = new SystemButton(this.parent, null, "gnome-logout", _("Logout"), _("Leave the session"), this.hover, this.iconSize, false);        
      button.actor.connect('enter-event', Lang.bind(this, this._onEnterEvent));
      button.actor.connect('leave-event', Lang.bind(this, this._onLeaveEvent));
      button.setAction(Lang.bind(this, this._onLogoutAction));

      this._powerButtons.push(button);

      //Shutdown button
      button = new SystemButton(this.parent, null, "gnome-shutdown", _("Quit"), _("Shutdown the computer"), this.hover, this.iconSize, false);        
      button.actor.connect('enter-event', Lang.bind(this, this._onEnterEvent));
      button.actor.connect('leave-event', Lang.bind(this, this._onLeaveEvent)); 
      button.setAction(Lang.bind(this, this._onShutdownAction));

      this._powerButtons.push(button);
      this.setTheme(theme);
   },

   setSeparatorSpace: function(space) {
      this.spacerPower.setSpace(space);
   },

   setSeparatorLine: function(haveLine) {
      this.spacerPower.setLineVisible(haveLine);
   },

   refresh: function() {
      this.setTheme(this.theme);
   },

   setTheme: function(theme) {
      this.theme = theme;
      this._removeButtons();
      switch(this.theme) {
         case "vertical":
            this.actor.set_vertical(true);
            this._setVerticalButtons(true);
            this._insertNormalButtons(St.Align.MIDDLE);
            this._setTextVisible(false);
            this._setIconsVisible(true);
            break;
         case "vertical-list":
            this.actor.set_vertical(true);
            this._setVerticalButtons(false);
            this._insertNormalButtons(St.Align.START);
            this._setTextVisible(true);
            this._setIconsVisible(true);
            break;
         case "vertical-grid":
            this.actor.set_vertical(true);
            this._setVerticalButtons(true);
            this._insertNormalButtons(St.Align.MIDDLE);
            this._setTextVisible(true);
            this._setIconsVisible(true);
            break;
         case "vertical-text":
            this.actor.set_vertical(true);
            this._setVerticalButtons(true);
            this._insertNormalButtons(St.Align.START);
            this._setTextVisible(true);
            this._setIconsVisible(false);
            break;
         case "horizontal":
            this.actor.set_vertical(false);
            this._setVerticalButtons(true);
            this._insertNormalButtons(St.Align.MIDDLE);
            this._setTextVisible(false);
            this._setIconsVisible(true);
            break;
         case "horizontal-list":
            this.actor.set_vertical(false);
            this._setVerticalButtons(false);
            this._insertNormalButtons(St.Align.MIDDLE);
            this._setTextVisible(true);
            this._setIconsVisible(true);
            break;
         case "horizontal-grid":
            this.actor.set_vertical(false);
            this._setVerticalButtons(true);
            this._insertNormalButtons(St.Align.MIDDLE);
            this._setTextVisible(true);
            this._setIconsVisible(true);
            break;
         case "horizontal-text":
            this.actor.set_vertical(false);
            this._setVerticalButtons(false);
            this._insertNormalButtons(St.Align.MIDDLE);
            this._setTextVisible(true);
            this._setIconsVisible(false);

            break;
         case "retractable":
            this.actor.set_vertical(true);
            this._setVerticalButtons(false);
            this._insertRetractableButtons(St.Align.START);
            this._setTextVisible(true);
            this._setIconsVisible(true);
            break;
         case "retractable-text":
            this.actor.set_vertical(true);
            this._setVerticalButtons(false);
            this._insertRetractableButtons(St.Align.START);
            this._setTextVisible(true);
            this._setIconsVisible(false);
            break;
      }
   },

   setSpecialColor: function(specialColor) {
      if(specialColor) {
         this.actor.set_style_class_name('menu-favorites-box');
         this.actor.add_style_class_name('menu-system-box');
      }
      else
         this.actor.set_style_class_name('');
   },

   _removeButtons: function() {
      let parentBtt = this.spacerPower.actor.get_parent();
      if(parentBtt)
         parentBtt.remove_actor(this.spacerPower.actor);
      for(let i = 0; i < this._powerButtons.length; i++) {
         parentBtt = this._powerButtons[i].actor.get_parent();
         if(parentBtt)
            parentBtt.remove_actor(this._powerButtons[i].actor);
      }
      this.actor.set_height(-1);
      this.actor.destroy_all_children();
      this.activeBar = null;
      this.spacer = null;
   },

   _insertNormalButtons: function(aling) {
      if((this.theme != "horizontal")&&(this.theme != "horizontal-list")&&(this.theme != "horizontal-grid")&&(this.theme != "horizontal-text"))
         this.actor.add_actor(this.spacerPower.actor);
      for(let i = 0; i < this._powerButtons.length; i++) {
         this.actor.add(this._powerButtons[i].actor, { x_fill: true, x_align: aling, expand: true });
         this._powerButtons[i].setTheme(this.theme);
      }
   },

  _insertRetractableButtons: function(aling) {
      this.actor.add_actor(this.spacerPower.actor);
      this.activeBar = new St.BoxLayout({ vertical: false });
      this.spacer = new St.BoxLayout({ vertical: true });
      this.spacer.style = "padding-left: "+(this.iconSize)+"px;margin:auto;";
      this.bttChanger = new ButtonChangerBox(this, "forward", this.iconSize, ["Show Down", "Options"], 0, Lang.bind(this, this._onPowerChange));
      this.bttChanger.setTextVisible(false);
      this.activeBar.add(this._powerButtons[2].actor, { x_fill: false, x_align: aling });
      this.activeBar.add(this.bttChanger.actor, { x_fill: true, x_align: aling });
      this.actor.add(this.activeBar, { x_fill: false, y_fill: false, x_align: aling, y_align: aling, expand: true });
      this.spacer.add(this._powerButtons[0].actor, { x_fill: true, x_align: aling, y_align: aling });
      this.spacer.add(this._powerButtons[1].actor, { x_fill: true, x_align: aling, y_align: aling });
      this.actor.add(this.spacer, { x_fill: false, x_align: aling, y_align: aling, expand: true });
      this._powerButtons[0].actor.visible = false;
      this._powerButtons[1].actor.visible = false;
      this._powerButtons[0].setTheme(this.theme);
      this._powerButtons[1].setTheme(this.theme);
      this._powerButtons[2].setTheme(this.theme);
      Mainloop.idle_add(Lang.bind(this, function() {
         this._adjustSize(this._powerButtons[2].actor);
         this._adjustSize(this._powerButtons[1].actor);
         this._adjustSize(this._powerButtons[0].actor);
      }));
   },

   _adjustSize: function(actor) {
      if(actor.get_width() + this.iconSize + 16 > this.activeBar.get_width()) {
         this.activeBar.set_width(actor.get_width() + this.iconSize + 16);
      }
      if(actor.get_height()*3 + 16 > this.actor.get_height()) {
         this.actor.set_height(actor.get_height()*3 + 16);
      }
   },

  _onPowerChange: function(actor, event) {
     this._powerButtons[0].actor.visible = !this._powerButtons[0].actor.visible;
     this._powerButtons[1].actor.visible = !this._powerButtons[1].actor.visible;
     if(this.powerSelected != -1) {
        this._powerButtons[this.powerSelected].setActive(false);
        this.powerSelected = -1;
        this.bttChanger.setActive(true);
     }
  },

  _setIconsVisible: function(visibleIcon) {
      for(let i = 0; i < this._powerButtons.length; i++) {
         this._powerButtons[i].setIconVisible(visibleIcon);
      }
   },

  _setTextVisible: function(visibleText) {
      for(let i = 0; i < this._powerButtons.length; i++) {
         this._powerButtons[i].setTextVisible(visibleText);
      }
   },

  _setVerticalButtons: function(vertical) {
      for(let i = 0; i < this._powerButtons.length; i++) {
         this._powerButtons[i].setVertical(vertical);
      }
   },

   indexOf: function(actor) {
      for(sysB in this._powerButtons)
         if(this._powerButtons[sysB].actor == actor)
            return sysB;
      return -1;
   },

   setIconSize: function(iconSize) {
      this.iconSize = iconSize;
      this.actor.set_height(-1);
      if(this._powerButtons) {
         for(let i = 0; i < this._powerButtons.length; i++)
            this._powerButtons[i].setIconSize(this.iconSize);
      } 
      if(this.activeBar) {
         this.spacer.style = "padding-left: "+(this.iconSize)+"px;margin:auto;";
         Mainloop.idle_add(Lang.bind(this, function() {
            this._adjustSize(this._powerButtons[0].actor);
            this._adjustSize(this._powerButtons[1].actor);
            this._adjustSize(this._powerButtons[2].actor);
         }));
      }
   },

   _onLockScreenAction: function() {
      this.parent.menu.close();
      let screensaver_settings = new Gio.Settings({ schema: "org.cinnamon.screensaver" });                        
      let screensaver_dialog = Gio.file_new_for_path("/usr/bin/cinnamon-screensaver-command");    
      if(screensaver_dialog.query_exists(null)) {
         if(screensaver_settings.get_boolean("ask-for-away-message")) {                                    
            Util.spawnCommandLine("cinnamon-screensaver-lock-dialog");
         }
         else {
            Util.spawnCommandLine("cinnamon-screensaver-command --lock");
         }
      }
      else {                
         this._screenSaverProxy.LockRemote();
      }
   },

   _onLogoutAction: function() {
      this.parent.menu.close();
      this._session.LogoutRemote(0);
   },

   _onShutdownAction: function() {
      this.parent.menu.close();
      this._session.ShutdownRemote();
   },

   _onEnterEvent: function(actor, event) {
      if(this.powerSelected != -1)
         this._powerButtons[this.powerSelected].setActive(false);
      this.parent.applicationsScrollBox.setAutoScrolling(false);
      this.parent.categoriesScrollBox.setAutoScrolling(false);
      //this.parent.favoritesScrollBox.setAutoScrolling(false);
      this.parent.applicationsScrollBox.setAutoScrolling(this.parent.autoscroll_enabled);
      this.parent.categoriesScrollBox.setAutoScrolling(this.parent.autoscroll_enabled);
      //this.parent.favoritesScrollBox.setAutoScrolling(this.autoscroll_enabled);
      this.powerSelected = this.indexOf(actor);
      this._powerButtons[this.powerSelected].setActive(true);
      this.selectedAppBox.setSelectedText(this._powerButtons[this.powerSelected].title, this._powerButtons[this.powerSelected].description);
      this.hover.refresh(this._powerButtons[this.powerSelected].icon);
   },

   _onLeaveEvent: function(actor, event) {
      this.selectedAppBox.setSelectedText("", "");
      this.hover.refreshFace();
      if(this.powerSelected != -1) {
         this._powerButtons[this.powerSelected].setActive(false);
         this.powerSelected = -1;
      }
   },

   disableSelected: function() {
      if(this.powerSelected != -1) {
         this._powerButtons[this.powerSelected].setActive(false);
         this.powerSelected = -1;
      }
      if(this.activeBar)
         this.bttChanger.activateSelected("Show Down");
   },

   navegatePowerBox: function(symbol, actor) {
      if(this.activeBar) {
         if((symbol == Clutter.KEY_Up) || (symbol == Clutter.KEY_Left)) {
            if(this.powerSelected == -1) {
               this.bttChanger.setActive(false);
               this.powerSelected = 2;
               this._powerButtons[this.powerSelected].setActive(true);
            } else if(this.powerSelected == 0) {
               this._powerButtons[this.powerSelected].setActive(false);
               this.powerSelected = -1;
               this.bttChanger.setActive(true);
            } else {
               this._powerButtons[this.powerSelected].setActive(false);
               if(this._powerButtons[this.powerSelected - 1].actor.visible) {
                  this.powerSelected--;
                  this._powerButtons[this.powerSelected].setActive(true);
               } else {
                  this.powerSelected = -1;
                  this.bttChanger.setActive(true);
               }
            }
         }
         else if((symbol == Clutter.KEY_Down) || (symbol == Clutter.KEY_Right)) {
            if(this.powerSelected == -1) {
               this.bttChanger.setActive(false);
               if(this._powerButtons[0].actor.visible)
                  this.powerSelected = 0;
               else
                  this.powerSelected = 2;
               this._powerButtons[this.powerSelected].setActive(true);
            } else if(this.powerSelected == 2) {
               this._powerButtons[this.powerSelected].setActive(false);
               this.powerSelected = -1;
               this.bttChanger.setActive(true);
            } else {
               this._powerButtons[this.powerSelected].setActive(false);
               this.powerSelected++;
               this._powerButtons[this.powerSelected].setActive(true);
            }
         }
         else if((symbol == Clutter.KEY_Return) || (symbol == Clutter.KP_Enter)) {
            if(this.powerSelected != -1) {
               this._powerButtons[this.powerSelected].setActive(false);
               this._powerButtons[this.powerSelected].executeAction();
            } else {
               this.bttChanger.activateNext();
            }
         }
      } else {
         if((symbol == Clutter.KEY_Up) || (symbol == Clutter.KEY_Left)) {
            this._powerButtons[this.powerSelected].setActive(false);
            if(this.powerSelected - 1 < 0)
               this.powerSelected = this._powerButtons.length -1;
            else
               this.powerSelected--;
            this._powerButtons[this.powerSelected].setActive(true);
         }
         else if((symbol == Clutter.KEY_Down) || (symbol == Clutter.KEY_Right)) {
            this._powerButtons[this.powerSelected].setActive(false);
            if(this.powerSelected + 1 < this._powerButtons.length)
               this.powerSelected++;
            else
               this.powerSelected = 0;
            this._powerButtons[this.powerSelected].setActive(true);
         }
         else if((symbol == Clutter.KEY_Return) || (symbol == Clutter.KP_Enter)) {
            this._powerButtons[this.powerSelected].setActive(false);
            this._powerButtons[this.powerSelected].executeAction();
         }
      }
      return true;
   }
};

function ControlButtonExtended(parent, title, description, iconName, iconSize, callBackExecution) {
   this._init(parent, title, description, iconName, iconSize, callBackExecution);
}

ControlButtonExtended.prototype = {
   __proto__: PopupMenu.PopupSubMenuMenuItem.prototype,
    
   _init: function(parent, title, description, iconName, iconSize, callBackExecution) {
      PopupMenu.PopupBaseMenuItem.prototype._init.call(this, {hover: true});
      this.parent = parent;
      this.title = title;
      this.description = description;
      this.iconName = iconName;
      this.iconSize = iconSize;
      this.callBackExecution = callBackExecution;
      this.actor.set_style_class_name('menu-category-button');
      this.actor.add_style_class_name('menu-control-button');
      
      this.container = new St.BoxLayout();
      this.iconObj = new St.Icon({icon_name: this.iconName, icon_type: St.IconType.SYMBOLIC, style_class: 'popup-menu-icon', icon_size: this.iconSize});
      if(this.iconObj) {
         this.container.add(this.iconObj, { x_align: St.Align.MIDDLE, y_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: false });
         this.iconObj.realize();
      }
      this.addActor(this.container);
   },

   setActive: function(active) {
      if(active) {
         this.parent.selectedAppBox.setSelectedText(this.title, this.description);
         global.set_cursor(Cinnamon.Cursor.POINTING_HAND);
         this.actor.set_style_class_name('menu-category-button-selected');
         this.actor.add_style_class_name('menu-control-button-selected');
      } else {
         this.parent.selectedAppBox.setSelectedText("", "");
         global.unset_cursor();
         this.actor.set_style_class_name('menu-category-button');
         this.actor.add_style_class_name('menu-control-button');
      }
      PopupMenu.PopupBaseMenuItem.prototype.setActive.call(this, active);
   },

   _onButtonReleaseEvent: function (actor, event) {
      if(this.callBackExecution)
         this.callBackExecution(actor, event);
   }
    
/*   activate: function(event) {
      this.parent.menu.close();
   }*/
};

function ControlBox(parent, iconSize) {
   this._init(parent, iconSize);
}

ControlBox.prototype = {
   _init: function(parent, iconSize) {
      this.parent = parent;
      this.iconSize = iconSize;
      this.actor = new St.BoxLayout({ vertical: false, style_class: 'menu-control-buttons-box' });
      //this.actor.style =  "padding-top: "+(0)+"px;padding-bottom: "+(10)+"px;padding-left: "+(4)+"px;padding-right: "+(4)+"px;margin:auto;";

      this.resizeBox = new St.BoxLayout({ vertical: false });
      //new ControlButtonExtended(parent, _("Full Screen"), _("Active or not the full screen mode"),
      //                               "zoom-fit-best", this.iconSize, Lang.bind(this, this._onClickedChangeFullScreen)).actor;
      this.bttFullScreen = this._createButton('view-fullscreen');
      this.bttFullScreen.connect('button-press-event', Lang.bind(this, function() {
         this.bttFullScreen.add_style_pseudo_class('pressed');
      }));
      this.bttFullScreen.connect('button-release-event', Lang.bind(this, this._onClickedChangeFullScreen));
      //this.bttFullScreen.connect('clicked', Lang.bind(this, this._onClickedChangeFullScreen));
      this.resizeBox.add(this.bttFullScreen, { x_fill: false, expand: false });
      this.bttResize = this._createButton('changes-prevent');
      this.bttResize.connect('button-press-event', Lang.bind(this, function() {
         this.bttResize.add_style_pseudo_class('pressed');
      }));
      this.bttResize.connect('button-release-event', Lang.bind(this, this._onClickedChangeResize));
      //this.bttResize.connect('clicked', Lang.bind(this, this._onClickedChangeResize));
      this.resizeBox.add(this.bttResize, { x_fill: false, expand: false });
      this.bttSettings = this._createButton('preferences-system');
      this.bttSettings.connect('button-press-event', Lang.bind(this, function() {
         this.bttSettings.add_style_pseudo_class('pressed');
      }));
      this.bttSettings.connect('button-release-event', Lang.bind(this, this._onSettings));
      //this.bttSettings.connect('clicked', Lang.bind(this, this._onSettings));
      this.resizeBox.add(this.bttSettings, { x_fill: false, x_align: St.Align.END, expand: true });
      this.actor.add(this.resizeBox, { x_fill: true, x_align: St.Align.START, y_align: St.Align.MIDDLE, expand: true });

      this.viewBox = new St.BoxLayout({ vertical: false });
      this.bttViewList = this._createButton('view-list-symbolic');
      this.bttViewList.connect('button-press-event', Lang.bind(this, function() {
         this.bttViewList.add_style_pseudo_class('pressed');
      }));
      this.bttViewList.connect('button-release-event', Lang.bind(this, this._onClickedChangeView));
      //this.bttViewList.connect('clicked', Lang.bind(this, this._onClickedChangeView));
      this.viewBox.add(this.bttViewList, { x_fill: false, expand: false });
      this.bttViewGrid = this._createButton('view-grid-symbolic');
      this.bttViewGrid.connect('button-press-event', Lang.bind(this, function() {
         this.bttViewGrid.add_style_pseudo_class('pressed');
      }));
      this.bttViewGrid.connect('button-release-event', Lang.bind(this, this._onClickedChangeView));
      //this.bttViewGrid.connect('clicked', Lang.bind(this, this._onClickedChangeView));
      this.viewBox.add(this.bttViewGrid, { x_fill: false, expand: false });
      this.actor.add(this.viewBox, { x_fill: false, x_align: St.Align.END, y_align: St.Align.MIDDLE, expand: true });

      this.changeViewSelected(this.parent.iconView);
      this.changeResizeActive(this.parent.controlingSize);
   },

   setSpecialColor: function(specialColor) {
      if(specialColor) {
         this.resizeBox.set_style_class_name('menu-favorites-box');
         this.viewBox.set_style_class_name('menu-favorites-box');
         this.resizeBox.add_style_class_name('menu-control-resize-box');
         this.viewBox.add_style_class_name('menu-control-view-box');
      }
      else {
         this.resizeBox.set_style_class_name('');
         this.viewBox.set_style_class_name('');
      }
   },

   setIconSymbolic: function(iconSymbolic) {
      let iconType;
      if(iconSymbolic)
         iconType = St.IconType.SYMBOLIC;
      else
         iconType = St.IconType.FULLCOLOR;
      let childBox = this.actor.get_children();
      let childBtt;
      for(let i = 0; i < childBox.length; i++) {
         childBtt = childBox[i].get_children();
         for(let j = 0; j < childBtt.length; j++) {
            childBtt[j].get_children()[0].set_icon_type(iconType);
         }
      }
   },

   _onClickedChangeView: function(actor, event) {
      this._effectIcon(actor, 0.2);
      this.bttViewGrid.remove_style_pseudo_class('pressed');
      this.bttViewList.remove_style_pseudo_class('pressed');
      this.changeViewSelected(!this.parent.iconView);
      this.parent._changeView();
   },

   _onClickedChangeResize: function(actor, event) {
      this._effectIcon(actor, 0.2);
      this.bttResize.remove_style_pseudo_class('pressed');
      this.parent.fullScreen = false;
      this.parent.automaticSize = false;
      this.parent._setFullScreen();
      this.changeResizeActive(!this.parent.controlingSize);
      this.parent._updateSize();
   },

   _onClickedChangeFullScreen: function(actor, event) {
      this._effectIcon(actor, 0.2);
      this.bttFullScreen.remove_style_pseudo_class('pressed');
      this.parent.fullScreen = !this.parent.fullScreen;
      this.parent._setFullScreen();
      this.changeFullScreen(this.parent.fullScreen);
   },

   _onSettings: function(actor, event) {
      this.bttSettings.remove_style_pseudo_class('pressed');
      this.parent.menu.close();
      Util.spawn(['cinnamon-settings', 'applets', this.parent.uuid]);
   },

   changeResizeActive: function(resizeActive) {
      this.parent.controlingSize = resizeActive;
      if(resizeActive) {
         this.bttResize.add_style_pseudo_class('open');
         this.bttResize.get_children()[0].set_icon_name('changes-prevent');
         this.parent.menu.setResizeArea(this.parent.deltaMinResize);
      }
      else {
         this.bttResize.remove_style_pseudo_class('open');
         this.bttResize.get_children()[0].set_icon_name('changes-allow');
         this.parent.menu.setResizeArea(0);
      }
   },

   changeViewSelected: function(iconView) {
      this.parent.iconView = iconView;
      if(iconView) {
         this.bttViewGrid.add_style_pseudo_class('open');
         this.bttViewList.remove_style_pseudo_class('open');
      }
      else {
         this.bttViewList.add_style_pseudo_class('open');
         this.bttViewGrid.remove_style_pseudo_class('open');
      }
   },

   changeFullScreen: function(fullScreen) {
      if(fullScreen) {
         this.bttFullScreen.add_style_pseudo_class('open');
         this.bttFullScreen.get_children()[0].set_icon_name('view-restore');
      }
      else {
         this.bttFullScreen.remove_style_pseudo_class('open')
         this.bttFullScreen.get_children()[0].set_icon_name('view-fullscreen');
         //this.bttFullScreen.get_children()[0].set_icon_name('window-maximize');
      }
   },

   setIconSize: function(iconSize) {
      let childBox = this.actor.get_children();
      let childBtt;
      for(let i = 0; i < childBox.length; i++) {
         childBtt = childBox[i].get_children();
         for(let j = 0; j < childBtt.length; j++) {
            childBtt[j].get_children()[0].set_icon_size(iconSize);
         }
      }
   },

   _createButton: function(icon) {
      let bttIcon = new St.Icon({icon_name: icon, icon_type: St.IconType.FULLCOLOR,
	                         style_class: 'popup-menu-icon', icon_size: this.iconSize});
      let btt = new St.Button({ child: bttIcon, style_class: 'menu-category-button' });
      btt.add_style_class_name('menu-control-button');
      btt.connect('notify::hover', Lang.bind(this, function(actor) {
         if(!this.parent.actorResize) {
            this.setActive(actor, actor.hover);
            if(actor.get_hover()) {
               switch(actor) {
                  case this.bttViewList:
                     this.parent.selectedAppBox.setSelectedText(_("List View"), _("Show application entries in list view"));
                     break;
                  case this.bttViewGrid:
                     this.parent.selectedAppBox.setSelectedText(_("Grid View"), _("Show application entries in grid view"));
                     break;
                  case this.bttResize:
                     if(this.bttResize.get_children()[0].get_icon_name() == 'changes-prevent')
                        this.parent.selectedAppBox.setSelectedText(_("Prevent resize"), _("Prevent resize the menu"));
                     else
                        this.parent.selectedAppBox.setSelectedText(_("Allow resize"), _("Allow resize the menu"));
                     break;
                  case this.bttFullScreen:
                     if(this.bttFullScreen.get_children()[0].get_icon_name() == 'window-minimize')
                        this.parent.selectedAppBox.setSelectedText(_("Recover size"), _("Recover the normal menu size"));
                     else
                        this.parent.selectedAppBox.setSelectedText(_("Full Screen"), _("Put the menu in full screen mode"));
                     break;
                  case this.bttSettings:
                     this.parent.selectedAppBox.setSelectedText(_("Configure..."), _("Configure the menu options"));
                     break;
               }
               global.set_cursor(Cinnamon.Cursor.POINTING_HAND);
               actor.set_style_class_name('menu-category-button-selected');
               actor.add_style_class_name('menu-control-button-selected');
            }
            else {
               this.parent.selectedAppBox.setSelectedText("", "");
               global.unset_cursor();
               actor.set_style_class_name('menu-category-button');
               actor.add_style_class_name('menu-control-button');
            }
         }
      }));
      this.actor.connect('key-focus-in', Lang.bind(this, function(actor) {
         this.setActive(actor, true);
      }));
      this.actor.connect('key-focus-out', Lang.bind(this, function(actor) {
         this.setActive(actor, false);
      }));
      return btt;
   },

   setActive: function (actor, active) {
        let activeChanged = active != this.active;
        if (activeChanged) {
            this.active = active;
            if (active) {
                actor.add_style_pseudo_class('active');
                if (this.focusOnHover) this.actor.grab_key_focus();
            } else
                actor.remove_style_pseudo_class('active');
            //this.emit('active-changed', active);
        }
    },

   navegateControlBox: function(symbol, actor) {
   },

   _effectIcon: function(effectIcon, time) {
      Tweener.addTween(effectIcon,
      {  opacity: 0,
         time: time,
         transition: 'easeInSine',
         onComplete: Lang.bind(this, function() {
            Tweener.addTween(effectIcon,
            {  opacity: 255,
               time: time,
               transition: 'easeInSine'
            });
         })
      });
   }
};

function ApplicationContextMenuItemExtended(appButton, label, action) {
   this._init(appButton, label, action);
}

ApplicationContextMenuItemExtended.prototype = {
   __proto__: PopupMenu.PopupBaseMenuItem.prototype,

   _init: function (appButton, label, action) {
      PopupMenu.PopupBaseMenuItem.prototype._init.call(this, {focusOnHover: false});
      this._appButton = appButton;
      this._action = action;
      this.label = new St.Label({ text: label });
      this.addActor(this.label);
   },

   activate: function (event) {
      switch (this._action) {
         case "add_to_panel":
            try {
               let winListApplet = imports.ui.appletManager.applets['WindowListGroup@jake.phy@gmail.com'];
               if(winListApplet)
                  winListApplet.applet.GetAppFavorites().addFavorite(this._appButton.app.get_id());
            } catch (e) {}
            
            let settings = new Gio.Settings({ schema: 'org.cinnamon' });
            let desktopFiles = settings.get_strv('panel-launchers');
            desktopFiles.push(this._appButton.app.get_id());
            settings.set_strv('panel-launchers', desktopFiles);
            /* if(!Main.AppletManager.get_object_for_uuid("panel-launchers@cinnamon.org")) {
               var new_applet_id = global.settings.get_int("next-applet-id");
               global.settings.set_int("next-applet-id", (new_applet_id + 1));
               var enabled_applets = global.settings.get_strv("enabled-applets");
               enabled_applets.push("panel1:right:0:panel-launchers@cinnamon.org:" + new_applet_id);
               global.settings.set_strv("enabled-applets", enabled_applets);
            }*/
            break;
         case "add_to_desktop":
            try {
               if(this._appButton.app.isPlace) {
                  this._appButton.app.make_desktop_file();
               } else {
                  let file = Gio.file_new_for_path(this._appButton.app.get_app_info().get_filename());
                  let destFile = Gio.file_new_for_path(USER_DESKTOP_PATH+"/"+this._appButton.app.get_id());
                  file.copy(destFile, 0, null, function(){});
                  // Need to find a way to do that using the Gio library, but modifying the access::can-execute attribute on the file object seems unsupported
                  Util.spawnCommandLine("chmod +x \""+USER_DESKTOP_PATH+"/"+this._appButton.app.get_id()+"\"");
               }
            } catch(e) {
               //Main.notify("err:", e.message);
               global.log(e);
            }
            break;
         case "add_to_favorites":
            AppFavorites.getAppFavorites().addFavorite(this._appButton.app.get_id());
            this._appButton.parent._updateSize();
            break;
         case "remove_from_favorites":
            AppFavorites.getAppFavorites().removeFavorite(this._appButton.app.get_id());
            break;
         case "add_to_accessible_panel":
           try {
            if(this._appButton.app.isPlace) {
               if(!this._appButton.parent.isInPlacesList(this._appButton.place.id)) {
                  let placesList = this._appButton.parent.getPlacesList();
                  placesList.push(this._appButton.place.id);
                  this._appButton.parent.setPlacesList(placesList);
                  
               }
            } else {
               if(!this._appButton.parent.isInAppsList(this._appButton.app.get_id())) {
                let appsList = this._appButton.parent.getAppsList();
                  appsList.push(this._appButton.app.get_id());
                  this._appButton.parent.setAppsList(appsList);
               }
            }
           } catch (e) {Main.notify("access", e.message);}
            break;
         case "remove_from_accessible_panel":
            try {
            if(this._appButton.app.isPlace) {
               if(this._appButton.parent.isInPlacesList(this._appButton.app.get_id())) {
                  let parentBtt = this._appButton.parent;
                  let placesList = parentBtt.getPlacesList();
                  placesList.splice(placesList.indexOf(this._appButton.place.id), 1);
                  parentBtt.setPlacesList(placesList);
               }
            } else {
               if(this._appButton.parent.isInAppsList(this._appButton.app.get_id())) {
                  let parentBtt = this._appButton.parent;
                  let appsList = parentBtt.getAppsList();
                  appsList.splice(appsList.indexOf(this._appButton.app.get_id()), 1);
                  parentBtt.setAppsList(appsList);
               }
            }
           } catch (e) {Main.notify("access", e.message);}
            break;
         case "edit_name":
            try {
            if(this._appButton.app.isPlace) {
               if(!(this._appButton instanceof PlaceButtonExtended)&&(this._appButton instanceof PlaceButtonAccessibleExtended)&&
                  (!this._appButton.nameEntry.visible))
                  this._appButton.editText(true);
            } else {
               if((this._appButton instanceof FavoritesButtonExtended)&&
                  (this._appButton.scrollActor != this._appButton.parent.favoritesScrollBox)&&(!this._appButton.nameEntry.visible))
                  this._appButton.editText(true);
            }
           } catch (e) {Main.notify("access", e.message);}
            break;
         case "default_name":
            try {
            if(this._appButton.app.isPlace) {
               if(!(this._appButton instanceof PlaceButtonExtended)&&(this._appButton instanceof PlaceButtonAccessibleExtended)) {
                  this._appButton.setDefaultText();
               }
            } else {
               if((this._appButton instanceof FavoritesButtonExtended)&&
                  (this._appButton.scrollActor != this._appButton.parent.favoritesScrollBox)) {
                  this._appButton.setDefaultText();
               }
            }
           } catch (e) {Main.notify("access", e.message);}
            break;
         case "save_name":
            try {
            if(this._appButton.app.isPlace) {
               if(!(this._appButton instanceof PlaceButtonExtended)&&(this._appButton instanceof PlaceButtonAccessibleExtended)&&
                 (this._appButton.nameEntry.visible)) {
                  this._appButton.editText(false);
               }
            } else {
               if((this._appButton instanceof FavoritesButtonExtended)&&
                  (this._appButton.scrollActor != this._appButton.parent.favoritesScrollBox)&&(this._appButton.nameEntry.visible)) {
                  this._appButton.editText(false);
               }
            }
           } catch (e) {Main.notify("access", e.message);}
            break;
      }
      this._appButton.toggleMenu();
      return false;
   }
};

function GenericApplicationButtonExtended(parent, parentScroll, app, withMenu) {
   this._init(parent, parentScroll, app, withMenu);
}

GenericApplicationButtonExtended.prototype = {
   __proto__: PopupMenu.PopupSubMenuMenuItem.prototype,
    
   _init: function(parent, parentScroll, app, withMenu) {
      PopupMenu.PopupBaseMenuItem.prototype._init.call(this, {hover: false});
      this.app = app;
      this.parent = parent;
      this.parentScroll = parentScroll;
      this.withMenu = withMenu;
      if(this.withMenu) {
         this.menu = new PopupMenu.PopupSubMenu(this.actor);
         this.menu.actor.set_style_class_name('menu-context-menu');
         this.menu.connect('open-state-changed', Lang.bind(this, this._subMenuOpenStateChanged));
      }
   },
    
   _onButtonReleaseEvent: function (actor, event) {
      if(event.get_button()==1) {
         this.activate(event);
      }
      if(event.get_button()==3) {
         if((this.withMenu) && (!this.menu.isOpen)) {
            this.parent.closeApplicationsContextMenus(this.app, true);
         }
         this.toggleMenu();
      }
      return true;
   },
    
   activate: function(event) {
      this.app.open_new_window(-1);
      this.parent.menu.close();
   },
    
   closeMenu: function() {
      if(this.withMenu) this.menu.close();
   },
    
   toggleMenu: function() {
      if(!this.withMenu) return;
      if(!this.menu.isOpen) {
         let children = this.menu.box.get_children();
         for(var i in children) {
            this.menu.box.remove_actor(children[i]);
         }
         let menuItem;
         if(!this.app.isPlace) {
            menuItem = new ApplicationContextMenuItemExtended(this, _("Add to panel"), "add_to_panel");
            this.menu.addMenuItem(menuItem);
            if(USER_DESKTOP_PATH) {
               menuItem = new ApplicationContextMenuItemExtended(this, _("Add to desktop"), "add_to_desktop");
               this.menu.addMenuItem(menuItem);
            }
            if(AppFavorites.getAppFavorites().isFavorite(this.app.get_id())) {
               menuItem = new ApplicationContextMenuItemExtended(this, _("Remove from favorites"), "remove_from_favorites");
               this.menu.addMenuItem(menuItem);
            } else {
               menuItem = new ApplicationContextMenuItemExtended(this, _("Add to favorites"), "add_to_favorites");
               this.menu.addMenuItem(menuItem);
            }
            if(this.parent.isInAppsList(this.app.get_id())) {
               menuItem = new ApplicationContextMenuItemExtended(this, _("Remove from accessible panel"), "remove_from_accessible_panel");
               this.menu.addMenuItem(menuItem);
            } else {
               menuItem = new ApplicationContextMenuItemExtended(this, _("Add to accessible panel"), "add_to_accessible_panel");
               this.menu.addMenuItem(menuItem);
            }
            if((this instanceof FavoritesButtonExtended)&&(this.parentScroll != this.parent.favoritesScrollBox)) {
               if(this.nameEntry.visible) {
                  menuItem = new ApplicationContextMenuItemExtended(this, _("Save name"), "save_name");
                  this.menu.addMenuItem(menuItem);
               } else {
                  menuItem = new ApplicationContextMenuItemExtended(this, _("Edit name"), "edit_name");
                  this.menu.addMenuItem(menuItem);
               }
               if((this.alterName)&&(this.alterName != "")) {
                  menuItem = new ApplicationContextMenuItemExtended(this, _("Default name"), "default_name");
                  this.menu.addMenuItem(menuItem);
               }
            }
         } else {
            if(USER_DESKTOP_PATH) {
               menuItem = new ApplicationContextMenuItemExtended(this, _("Add to desktop"), "add_to_desktop");
               this.menu.addMenuItem(menuItem);
            }
            if(this.parent.isInPlacesList(this.app.get_id())) {
               menuItem = new ApplicationContextMenuItemExtended(this, _("Remove from accessible panel"), "remove_from_accessible_panel");
               this.menu.addMenuItem(menuItem);
            } else {
               menuItem = new ApplicationContextMenuItemExtended(this, _("Add to accessible panel"), "add_to_accessible_panel");
               this.menu.addMenuItem(menuItem);
            }
            if(!(this instanceof PlaceButtonExtended)&&(this instanceof PlaceButtonAccessibleExtended)) {
               if(this.nameEntry.visible) {
                  menuItem = new ApplicationContextMenuItemExtended(this, _("Save name"), "save_name");
                  this.menu.addMenuItem(menuItem);
               } else {
                  menuItem = new ApplicationContextMenuItemExtended(this, _("Edit name"), "edit_name");
                  this.menu.addMenuItem(menuItem);
               }
               if((this.alterName)&&(this.alterName != "")) {
                  menuItem = new ApplicationContextMenuItemExtended(this, _("Default name"), "default_name");
                  this.menu.addMenuItem(menuItem);
               }
            }
         }
      }
      this.menu.toggle();
      this.parent._updateSize();
   },
    
   _subMenuOpenStateChanged: function() {
      if(this.menu.isOpen) {
         this.parentScroll.scrollToActor(this.menu.actor);
      }
   },

   _onKeyPressEvent: function(actor, event) {
      let symbol = event.get_key_symbol();
/*
      if(symbol == Clutter.KEY_space) {
         if((this.withMenu) && (!this.menu.isOpen)) {
            this.parent.closeApplicationsContextMenus(this.app, true);
         }
         this.toggleMenu();
         return true;
      }*/
      return PopupBaseMenuItem.prototype._onKeyPressEvent.call(this, actor, event);
   }
};

function CategoriesApplicationsBoxExtended() {
   this._init();
}

CategoriesApplicationsBoxExtended.prototype = {
   _init: function() {
      this.actor = new St.BoxLayout();
      this.actor._delegate = this;
   },
    
   acceptDrop : function(source, actor, x, y, time) {
      if(source instanceof FavoritesButtonExtended) {
         source.actor.destroy();
         actor.destroy();
         AppFavorites.getAppFavorites().removeFavorite(source.app.get_id());
         return true;
      }
      return false;
   }
};


function SystemBox() {
   this._init();
}

SystemBox.prototype = {
   _init: function() {
      this.actor = new St.BoxLayout();
      this.actor._delegate = this;
   },
    
   acceptDrop : function(source, actor, x, y, time) {
      if(source instanceof FavoritesButtonExtended) {
         source.actor.destroy();
         actor.destroy();
         AppFavorites.getAppFavorites().removeFavorite(source.app.get_id());
         return true;
      }
      return false;
   }
};

function VisibleChildIteratorExtended(parent, container, numberView) {
   this._init(parent, container, numberView);
}

VisibleChildIteratorExtended.prototype = {
   __proto__: CinnamonMenu.VisibleChildIterator.prototype,
   _init: function(parent, container, numberView) {
      this.container = container;
      this._parent = parent;
      this._numberView = numberView;
      this._num_children = 0;
      this.reloadVisible();
   },

   reloadVisible: function() {
      try {
      /*if(this._numberView == 1) {
         this.visible_children = new Array();
         this.abs_index = new Array();
         let child;
         let children = this.container.get_children();
         for (let i = 0; i < children.length; i++) {
            child = children[i];
            if (child.visible) {
                this.visible_children.push(child);
                this.abs_index.push(i);
            }
         }
      }
      else {*/
         this.visible_children = new Array();
         this.abs_index = new Array();
         this.inter_index = new Array();
         let child, internalBox, intIndex;
         let children = this.container.get_children();
         for(let j = 0; j < children.length; j++) {
            internalBox = children[j].get_children();
            intIndex = 0;
            for(let i = 0; i < internalBox.length; i++) {
               child = internalBox[i];
               if(child.visible) {
                  this.visible_children.push(child);
                  this.abs_index.push(j);
                  this.inter_index.push(intIndex);
                  intIndex++;
               }
            }
         }
   //   }
      this._num_children = this.visible_children.length;
      } catch(e) {
         Main.notify(e.message);
      }
   },

   setNumberView: function(numberView) {
      this._numberView = numberView;
   },

   getNextVisible: function(cur_child) {
      if(this.visible_children.indexOf(cur_child) == this._num_children-1)
         return this.visible_children[0];
      else
         return this.visible_children[this.visible_children.indexOf(cur_child)+1];
   },

   getPrevVisible: function(cur_child) {
      if(this.visible_children.indexOf(cur_child) == 0)
         return this.visible_children[this._num_children-1];
      else
         return this.visible_children[this.visible_children.indexOf(cur_child)-1];
   },

   getLeftVisible: function(cur_child) {
      let rowIndex = cur_child.get_parent().get_children().indexOf(cur_child);
      let colIndex = cur_child.get_parent().get_parent().get_children().indexOf(cur_child.get_parent());
      if(colIndex == 0)
         return cur_child.get_parent().get_parent().get_child_at_index(this._numberView - 1).get_child_at_index(rowIndex);
      else
         return cur_child.get_parent().get_parent().get_child_at_index(colIndex - 1).get_child_at_index(rowIndex);
   },

   getRightVisible: function(cur_child) {
      let rowIndex = cur_child.get_parent().get_children().indexOf(cur_child);
      let colIndex = cur_child.get_parent().get_parent().get_children().indexOf(cur_child.get_parent());
      let right_item;
      if(colIndex == this._numberView - 1)
         right_item = cur_child.get_parent().get_parent().get_child_at_index(0).get_child_at_index(rowIndex);
      else {
         right_item = cur_child.get_parent().get_parent().get_child_at_index(colIndex + 1).get_child_at_index(rowIndex);
         if(!right_item)
            right_item = right_item = cur_child.get_parent().get_parent().get_child_at_index(0).get_child_at_index(rowIndex);
      }
      return right_item;
   },

   getFirstVisible: function() {
      return this.visible_children[0];
   },

   getLastVisible: function() {
      return this.visible_children[this._num_children-1];
   },

   getVisibleIndex: function(cur_child) {
      return this.visible_children.indexOf(cur_child);
   },

   getVisibleItem: function(index) {
      return this.visible_children[index];
   },

   getNumVisibleChildren: function() {
      return this._num_children;
   },

   getInternalIndexOfChild: function(child) {
      //return child.get_parent().get_parent().get_children().indexOf(child.get_parent());
      if(this.inter_index)
         return this.inter_index[this.visible_children.indexOf(child)];
      return 0;
   },

   getAbsoluteIndexOfChild: function(child) {
      return this.abs_index[this.visible_children.indexOf(child)];
   }
};

function HoverIcon(parent, iconSize) {
   this._init(parent, iconSize);
}

HoverIcon.prototype = {
   __proto__: PopupMenu.PopupSubMenuMenuItem.prototype,
    
   _init: function(parent, iconSize) {
      PopupMenu.PopupBaseMenuItem.prototype._init.call(this, {hover: false, focusOnHover: false });
      try {
         //this.actor._delegate = this;
         this.parent = parent;
         this.iconSize = iconSize;

         this.container = new St.BoxLayout({ vertical: false });
         this.container.add_actor(this.actor);

         this._userIcon = new St.Icon({ icon_size: this.iconSize });
         this.icon = new St.Icon({ icon_size: this.iconSize, icon_type: St.IconType.FULLCOLOR });
         
         this.menu = new PopupMenu.PopupSubMenu(this.actor);
         this.container.add_actor(this.menu.actor);
         this.menu.actor.set_style_class_name('menu-context-menu');
         this.menu.connect('open-state-changed', Lang.bind(this, this._subMenuOpenStateChanged));

         this._user = AccountsService.UserManager.get_default().get_user(GLib.get_user_name());
         this._userLoadedId = this._user.connect('notify::is_loaded', Lang.bind(this, this._onUserChanged));
         this._userChangedId = this._user.connect('changed', Lang.bind(this, this._onUserChanged));

         let menuItem;
         let userBox = new St.BoxLayout({ style_class: 'user-box', vertical: false });
         this.userLabel = new St.Label(({ /*style_class: 'user-label'*/}));
         userBox.add(this.userLabel, { x_fill: false, y_fill: false, x_align: St.Align.START, y_align: St.Align.MIDDLE, expand: true });
         this.menu.addActor(userBox);

         this.notificationsSwitch = new PopupMenu.PopupSwitchMenuItem(_("Notifications"), this._toggleNotifications, { focusOnHover: false });
         this.notificationsSwitch.actor.style = "padding-top: "+(2)+"px;padding-bottom: "+(2)+"px;padding-left: "+(1)+"px;padding-right: "+(1)+"px;margin:auto;";
         this.menu.addMenuItem(this.notificationsSwitch);
         global.settings.connect('changed::display-notifications', Lang.bind(this, function() {
            this.notificationsSwitch.setToggleState(global.settings.get_boolean("display-notifications"));
         }));
         this.notificationsSwitch.connect('toggled', Lang.bind(this, function() {
            global.settings.set_boolean("display-notifications", this.notificationsSwitch.state);
         }));

         this.account = new PopupMenu.PopupMenuItem(_("Account Details"), { focusOnHover: false });
         this.account.actor.style = "padding-top: "+(2)+"px;padding-bottom: "+(2)+"px;padding-left: "+(1)+"px;padding-right: "+(1)+"px;margin:auto;";
         this.menu.addMenuItem(this.account);
         this.account.connect('activate', Lang.bind(this, function() {
            Util.spawnCommandLine("cinnamon-settings user");
         }));

         this._onUserChanged();
         this.refreshFace();
         this.actor.style = "padding-top: "+(0)+"px;padding-bottom: "+(0)+"px;padding-left: "+(0)+"px;padding-right: "+(0)+"px;margin:auto;";
         this.actor.connect('button-press-event', Lang.bind(this, function() {
            this.container.add_style_pseudo_class('pressed');
         }));
      } catch(e) {
         Main.notifyError("ErrorHover:",e.message);
      }
   },

   setSpecialColor: function(specialColor) {
      if(specialColor) {
         this.container.set_style_class_name('menu-favorites-box');
         this.container.add_style_class_name('menu-hover-icon-box');
      }
      else {
         this.container.set_style_class_name('');
      }
   },
/*
   setActive: function(active) {
      this.actor.remove_style_pseudo_class('active');
   },
*/
   navegateHoverMenu: function(symbol, actor) {
      if((symbol == Clutter.KEY_Down)||(symbol == Clutter.KEY_Up)) {
         if(this.account.active) {
            this.fav_actor = this.notificationsSwitch.actor;
            Mainloop.idle_add(Lang.bind(this, this._putFocus));
         }
         if(this.notificationsSwitch.active) {
            this.fav_actor = this.account.actor;
            Mainloop.idle_add(Lang.bind(this, this._putFocus));
         }
      }
   },

   _onKeyPressEvent: function(actor, event) {
      let symbol = event.get_key_symbol();

      if(symbol == Clutter.KEY_Right) {
         this.toggleMenu();
         global.stage.set_key_focus(this.notificationsSwitch.actor);
         //this.menu.actor.navigate_focus(null, Gtk.DirectionType.DOWN, false);
         return true;
      } else if (symbol == Clutter.KEY_Left && this.menu.isOpen) {
         global.stage.set_key_focus(this.actor);
         this.toggleMenu();
         return true;
      }

      return PopupBaseMenuItem.prototype._onKeyPressEvent.call(this, actor, event);
    },

   _putFocus: function() {
      global.stage.set_key_focus(this.fav_actor);
   },

   setIconSize: function (iconSize) {
      this.iconSize = iconSize;
      if(this._userIcon)
         this._userIcon.set_icon_size(this.iconSize);
      if(this.icon)
         this.icon.set_icon_size(this.iconSize);
      if(this.lastApp)
         this.lastApp.set_icon_size(this.iconSize);
   },

   _onButtonReleaseEvent: function (actor, event) {
      if(event.get_button()==1) {
         this.activate(event);
      }
      if(event.get_button()==3) {
         this.toggleMenu();
         this.controlBox.visible = false;
         this.controlBox.visible = true;
      }
      this.actor.remove_style_pseudo_class('pressed');
      return true;
   },

   _subMenuOpenStateChanged: function(menu, open) {
       if(this.menu.isOpen) {
          this.parent._updateSize();
          //this.menu.actor.can_focus = false;
       }
       else {
          //global.stage.set_key_focus(this.parent.searchEntry);
          //this.menu.actor.can_focus = true;
       }
   },
    
   activate: function(event) {
      //this.parent.menu.close();
      //Main.notify("close");
      //PopupBaseMenuItem.prototype.activate.call(this, event, true);
   },

   closeMenu: function() {
      this.menu.close(true);
      this.setActive(false);
      this.container.remove_style_pseudo_class('open');
   },
    
   toggleMenu: function() {
      if(this.menu.isOpen) {
         this.menu.close(true);
         this.container.remove_style_pseudo_class('open');
         this.menu.sourceActor._delegate.setActive(false);
      } else {
         this.menu.open();
         this.container.add_style_pseudo_class('open');
         this.menu.sourceActor._delegate.setActive(true);
      }
   },

   _onUserChanged: function() {
      if(this._user.is_loaded) {
         this.userLabel.set_text (this._user.get_real_name());
         if(this._userIcon) {

            let iconFileName = this._user.get_icon_file();
            let iconFile = Gio.file_new_for_path(iconFileName);
            let icon;
            if(iconFile.query_exists(null)) {
               icon = new Gio.FileIcon({file: iconFile});
            } else {
               icon = new Gio.ThemedIcon({name: 'avatar-default'});
            }
            this._userIcon.set_gicon(icon);
            this._userIcon.show(); 
 
         }
      }
   },

   refresh: function (icon) {
      this._removeIcon();
      if(this.icon) {
         this.addActor(this.icon, 0);
         this.icon.set_icon_name(icon);
      }
   },

   refreshApp: function (app) {
      this._removeIcon();
      this.lastApp = app.create_icon_texture(this.iconSize);
      if(this.lastApp) {
         this.addActor(this.lastApp, 0);
      }
   },

   refreshPlace: function (place) {
      this._removeIcon();
      this.lastApp = place.iconFactory(this.iconSize);
      if(this.lastApp) {
         this.addActor(this.lastApp, 0);
      }
   },

   refreshFile: function (file) {
      this._removeIcon();
      this.lastApp = file.createIcon(this.iconSize);
      if(this.lastApp) {
         this.addActor(this.lastApp, 0);
      }
   },

   refreshFace: function () {
      this._removeIcon();
      if(this._userIcon) {
         this.addActor(this._userIcon, 0);
      }
   },

   _removeIcon: function () {
      if(this.lastApp) {
         this.removeActor(this.lastApp);
         this.lastApp.destroy();
         this.lastApp = null;
      }
      if((this.icon)&&(this.icon.get_parent() == this.actor))
         this.removeActor(this.icon);
      if((this._userIcon)&&(this._userIcon.get_parent() == this.actor))
         this.removeActor(this._userIcon);
   }
};

function AccessibleDropBox(parent, place) {
   this._init(parent, place);
}

AccessibleDropBox.prototype = {
   _init: function(parent, place) {
      this.parent = parent;
      this.place = place;
      this.actor = new St.BoxLayout({ vertical: true });
      this.actor._delegate = this;

      this._dragPlaceholder = null;
      this._dragPlaceholderPos = -1;
      this._animatingPlaceholdersCount = 0;
   },
    
   _clearDragPlaceholder: function() {
      if(this._dragPlaceholder) {
         this._dragPlaceholder.animateOutAndDestroy();
         this._dragPlaceholder = null;
         this._dragPlaceholderPos = -1;
      }
   },
    
   handleDragOver: function(source, actor, x, y, time) {
    try {
      let currentObj, classType1, classType2;
      if(this.place) {
         currentObj = this.parent.getPlacesList();
         classType1 = PlaceButtonAccessibleExtended;
         classType2 = PlaceButtonExtended;
      } else {
         currentObj = this.parent.getAppsList();
         classType1 = FavoritesButtonExtended;
         classType2 = ApplicationButtonExtended;
      }
      let app = source.app;
      let itemPos = currentObj.indexOf(app.get_id());
      // Don't allow favoriting of transient apps
      if(app == null || app.is_window_backed() || ((!(source instanceof classType1)) && (!(source instanceof classType2))))
         return DND.DragMotionResult.NO_DROP;

      let numItems = currentObj.length;

      let children = this.actor.get_children();
      let numChildren = children.length;

      let boxHeight = this.actor.height;


      // Keep the placeholder out of the index calculation; assuming that
      // the remove target has the same size as "normal" items, we don't
      // need to do the same adjustment there.
      if(this._dragPlaceholder) {
         boxHeight -= this._dragPlaceholder.actor.height;
         numChildren--;
      }
      let pos = Math.round(y * numItems / boxHeight);

      if(pos <= numItems) {
        /* if(this._animatingPlaceholdersCount > 0) {
            let appChildren = children.filter(function(actor) {
               return ((actor._delegate instanceof classType1) || (actor._delegate instanceof classType2));
            });
            this._dragPlaceholderPos = children.indexOf(appChildren[pos]);
         } else {*/
            this._dragPlaceholderPos = pos;
      //   }

         // Don't allow positioning before or after self
      /*   if(itemPos != -1 && (pos == itemPos || pos == itemPos + 1)) {
            if(this._dragPlaceholder) {
               this._dragPlaceholder.animateOutAndDestroy();
               this._animatingPlaceholdersCount++;
               this._dragPlaceholder.actor.connect('destroy',
                  Lang.bind(this, function() {
                     this._animatingPlaceholdersCount--;
                  }));
            }
            this._dragPlaceholder = null;

            return DND.DragMotionResult.CONTINUE;
         }*/

         // If the placeholder already exists, we just move
         // it, but if we are adding it, expand its size in
         // an animation
         let fadeIn;
         if(this._dragPlaceholder) {
            let parentPlaceHolder = this._dragPlaceholder.actor.get_parent();
            if(parentPlaceHolder) parentPlaceHolder.remove_actor(this._dragPlaceholder.actor);
            this._dragPlaceholder.actor.destroy();
            fadeIn = false;
         } else {
            fadeIn = true;
         }

         this._dragPlaceholder = new DND.GenericDragPlaceholderItem();
         this._dragPlaceholder.child.set_width (source.actor.width);
         this._dragPlaceholder.child.set_height (source.actor.height);
         this.actor.insert_actor(this._dragPlaceholder.actor, 2*this._dragPlaceholderPos);
         if(fadeIn)
            this._dragPlaceholder.animateIn();
      }

      let srcIsCurrentItem = (itemPos != -1);

      if(srcIsCurrentItem)
         return DND.DragMotionResult.MOVE_DROP;

      return DND.DragMotionResult.COPY_DROP;
     } catch(e) {
        Main.notify("Drag and Drop problem:", e.message);
     }
     return DND.DragMotionResult.NO_DROP;
   },
    
   // Draggable target interface
   acceptDrop: function(source, actor, x, y, time) {
      let currentObj, classType1, classType2;
      if(this.place) {
         currentObj = this.parent.getPlacesList();
         classType1 = PlaceButtonAccessibleExtended;
         classType2 = PlaceButtonExtended;
      } else {
         currentObj = this.parent.getAppsList();
         classType1 = FavoritesButtonExtended;
         classType2 = ApplicationButtonExtended;
      }

      let app = source.app;

      // Don't allow favoriting of transient apps
      if(app == null || app.is_window_backed() || ((!(source instanceof classType1)) && (!(source instanceof classType2)))) {
         return false;
      }

      let id = app.get_id();

      let itemPos = currentObj.indexOf(app.get_id());
      let srcIsCurrentItem = (itemPos != -1);

      itemPos = this._dragPlaceholderPos;
/*       let children = this.actor.get_children();
         for(let i = 0; i < this._dragPlaceholderPos; i++) {
            if(this._dragPlaceholder && children[i] == this._dragPlaceholder.actor)
               continue;
            
            if(!(children[i]._delegate instanceof classType1)) continue;

            let childId = children[i]._delegate.app.get_id();
            if(childId == id)
               continue;
            if(currentObj.indexOf(childId) != -1)
               itemPos++;
         }*/

      Meta.later_add(Meta.LaterType.BEFORE_REDRAW, Lang.bind(this, function () {
         if(srcIsCurrentItem) {//moveFavoriteToPos
            currentObj.splice(currentObj.indexOf(app.get_id()), 1);
            currentObj.splice(itemPos, 0, id);
            if(this.place)
               this.parent.setPlacesList(currentObj);
            else
               this.parent.setAppsList(currentObj);
         }
         else {
            currentObj.splice(itemPos, 0, id);
            if(this.place)
               this.parent.setPlacesList(currentObj);
            else
               this.parent.setAppsList(currentObj);
         }
         return false;
      }));

      return true;
   }
};

function FavoritesBoxLine(parentBox, vertical) {
   this._init(parentBox, vertical);
}

FavoritesBoxLine.prototype = {
   _init: function(parentBox, vertical) {
      this.parentBox = parentBox;
      this.vertical = vertical;
      this.actor = new St.BoxLayout({ vertical: vertical });
      this.actor._delegate = this;
        
      this._dragPlaceholder = null;
      this._dragPlaceholderPos = -1;
      this._animatingPlaceholdersCount = 0;
   },
    
   _clearDragPlaceholder: function() {
      if(this._dragPlaceholder) {
         this._dragPlaceholder.animateOutAndDestroy();
         this._dragPlaceholder = null;
         this._dragPlaceholderPos = -1;
      }
   },
    
   handleDragOver : function(source, actor, x, y, time) {
      try {
         let app = source.app;
         // Don't allow favoriting of transient apps
         if(app == null || app.is_window_backed() || (!(source instanceof FavoritesButtonExtended) && app.get_id() in AppFavorites.getAppFavorites().getFavoriteMap()))
            return DND.DragMotionResult.NO_DROP;

         let favorites = AppFavorites.getAppFavorites().getFavorites();
         let favPos = favorites.indexOf(app);

         let children = this.actor.get_children();
         let numChildren = children.length;
         let boxSize;
         let coord;
         if(this.actor.get_vertical()) {
            boxSize = this.actor.height;
            coord = y;
         } else {
            boxSize = this.actor.width;
            coord = x;
         }
         // Keep the placeholder out of the index calculation; assuming that
         // the remove target has the same size as "normal" items, we don't
         // need to do the same adjustment there.
         if(this._dragPlaceholder) {
            if(this.actor.get_vertical())
               boxSize -= this._dragPlaceholder.actor.height;
            else
               boxSize -= this._dragPlaceholder.actor.width;
            numChildren--;
         }

         let pos = Math.round(coord * numChildren / (boxSize));
        // if(pos != this._dragPlaceholderPos && pos <= numChildren) {
         if(pos <= numChildren) {
          /*  if(this._animatingPlaceholdersCount > 0) {
               let appChildren = children.filter(function(actor) {
                  return (actor._delegate instanceof FavoritesButton);
               });
               this._dragPlaceholderPos = children.indexOf(appChildren[pos]);
            } else {*/
               this._dragPlaceholderPos = pos;
         //   }

            // Don't allow positioning before or after self
           /* if(favPos != -1 && (pos == favPos || pos == favPos + 1)) {
               if(this._dragPlaceholder) {
                  this._dragPlaceholder.animateOutAndDestroy();
                  this._animatingPlaceholdersCount++;
                  this._dragPlaceholder.actor.connect('destroy',
                  Lang.bind(this, function() {
                     this._animatingPlaceholdersCount--;
                  }));
               }
               this._dragPlaceholder = null;

               return DND.DragMotionResult.CONTINUE;
            }*/

            // If the placeholder already exists, we just move
            // it, but if we are adding it, expand its size in
            // an animation
            let fadeIn;
            if(this._dragPlaceholder) {
               let parentPlaceHolder = this._dragPlaceholder.actor.get_parent();
               if(parentPlaceHolder) parentPlaceHolder.remove_actor(this._dragPlaceholder.actor);
               this._dragPlaceholder.actor.destroy();
               fadeIn = false;
            } else {
               fadeIn = true;
            }

            this._dragPlaceholder = new DND.GenericDragPlaceholderItem();
            this._dragPlaceholder.child.set_width (source.actor.height);
            this._dragPlaceholder.child.set_height (source.actor.height);
            this.actor.insert_actor(this._dragPlaceholder.actor, this._dragPlaceholderPos);
            this.parentBox._onDragPlaceholderChange(this._dragPlaceholder);
            if(fadeIn)
               this._dragPlaceholder.animateIn();
         }

         let srcIsFavorite = (favPos != -1);

         if(srcIsFavorite)
            return DND.DragMotionResult.MOVE_DROP;

         return DND.DragMotionResult.COPY_DROP;
      } catch(e) {
         Main.notify("Invalid Drag: " + e.message);
      }
      return DND.DragMotionResult.NO_DROP;
   },
    
   // Draggable target interface
   acceptDrop : function(source, actor, x, y, time) {
      try {
         let app = source.app;

         // Don't allow favoriting of transient apps
         if(app == null || app.is_window_backed()) {
            return false;
         }

         let id = app.get_id();

         let favorites = AppFavorites.getAppFavorites().getFavoriteMap();

         let srcIsFavorite = (id in favorites);

         let favPos = 0;
         let children = this.actor.get_children();
         if(children.length == 0)
            favPos = favorites.length -1;
         else {
            for(let i = 0; i < this._dragPlaceholderPos; i++) {
               if(this._dragPlaceholder &&
                  children[i] == this._dragPlaceholder.actor)
                  continue;
            
               if(!(children[i]._delegate instanceof FavoritesButtonExtended)) continue;

               let childId = children[i]._delegate.app.get_id();
               if(childId == id)
                  continue;
               if(childId in favorites)
                  favPos++;
            }
            favPos = this.parentBox.getBeginPosAtLine(this, favPos);
         }

         Meta.later_add(Meta.LaterType.BEFORE_REDRAW, Lang.bind(this, function () {
            Mainloop.idle_add(Lang.bind(this, function() {
               let appFavorites = AppFavorites.getAppFavorites();
               if(srcIsFavorite)
                  appFavorites.moveFavoriteToPos(id, favPos);
               else
                  appFavorites.addFavoriteAtPos(id, favPos);
            }));
            return false;
         }));

         return true;
      } catch(e) {
         Main.notify("Drop Fail:" + e.message);
      }
      return false;
   }
};

function FavoritesBoxExtended(parent, vertical, numberLines) {
   this._init(parent, vertical, numberLines);
}

FavoritesBoxExtended.prototype = {
   _init: function(parent, vertical, numberLines) {
      this.parent = parent;
      this.favRefresh = true;
      this.actor = new St.BoxLayout();
      this.actor.set_vertical(!vertical);
      //this.actor._delegate = this;
      this.linesDragPlaces = new Array();
      let internalLine;
      for(let i = 0; i < numberLines; i++) {
         internalLine = new FavoritesBoxLine(this, vertical);
         this.linesDragPlaces.push(internalLine);
         this.actor.add(internalLine.actor, { x_align: St.Align.MIDDLE, y_align: St.Align.START, x_fill: false, y_fill: false, expand: true });
      }
      this.setVertical(vertical);
   },

   _onDragPlaceholderChange: function(dragPlaceholder) {
      let currLinePlaceholder;
      this._dragPlaceholder = dragPlaceholder;
      for(let i = 0; i < this.linesDragPlaces.length; i++) {
         currLinePlaceholder = this.linesDragPlaces[i];
         if((currLinePlaceholder._dragPlaceholder)&&(currLinePlaceholder._dragPlaceholder != dragPlaceholder)) {
            currLinePlaceholder._clearDragPlaceholder();
         }
      }
   },

   getNumberLines: function() {
      return this.linesDragPlaces.length;
   },

   getBeginPosAtLine: function(line, itemPos) {
      this.favRefresh = false;
      let sumOfElements = 0;
      if(itemPos > 0)
         sumOfElements += this.linesDragPlaces.length*(itemPos);
      return sumOfElements + this.linesDragPlaces.indexOf(line);
   },

   needRefresh: function() {
      return this.favRefresh;
   },

   setNumberLines: function(numberLines) {
      let childrens;
      let saveItems = new Array();
      for(let i = 0; i < this.linesDragPlaces.length; i++) {
         childrens = this.linesDragPlaces[i].actor.get_children();
         for(let j = 0; j < childrens.length; j++) {
            saveItems.push(childrens[j]);
            childrens[i].remove_actor(childrens[j]);
         }
      }
      let internalLine;
      for(let i = this.linesDragPlaces.length; i < numberLines; i++) {
         internalLine = new FavoritesBoxLine(this, this.isVertical);
         this.linesDragPlaces.push(internalLine);
         this.actor.add(internalLine.actor, { x_align: St.Align.MIDDLE, y_align: St.Align.START, x_fill: false, y_fill: false, expand: true });
      }
      let lastPos = this.linesDragPlaces.length;
      while(numberLines < lastPos) {
         lastPos--;
         this.actor.remove_actor(this.linesDragPlaces[lastPos].actor);
         this.linesDragPlaces[lastPos].actor.destroy();
         this.linesDragPlaces.splice(lastPos, 1);
      }
      for(let i = 0; i < saveItems.length; i++) {
         this.add(saveItems[i]);
      }
      //Main.notify("chil:" + this.actor.get_children().length + " line:" + this.linesDragPlaces.length);
   },

   setVertical: function(vertical) {
      this.isVertical = vertical;
      this.actor.set_vertical(!vertical);
      let childrens = this.actor.get_children();
      for(let i = 0; i < childrens.length; i++) {
         childrens[i].set_vertical(vertical);
      }
   },

   getFirstElement: function() {
      let childrens = this.actor.get_children();
      if(childrens.length > 0) {
         let childrensItems = childrens[0].get_children();
         if(childrensItems.length > 0)
            return childrensItems[0];
      }
      return null;
   },

   getVertical: function() {
      return this.isVertical;
   },

   getRealSpace: function() {
      let result = 0;
      let childrens = this.actor.get_children();
      for(let i = 0; i < childrens.length; i++)
         result += childrens[i].get_height();
      return result;
   },

   add: function(actor, menu, properties) {
try {
      let childrens = this.actor.get_children();
      let currentNumberItems = childrens[0].get_children().length;
      for(let i = 1; i < childrens.length; i++) {
         if(currentNumberItems > childrens[i].get_children().length) {
            this._addInCorrectBox(childrens[i], actor, menu, properties);
            currentNumberItems--; 
            break;
         }
      }
      if(currentNumberItems == childrens[0].get_children().length)
         this._addInCorrectBox(childrens[0], actor, menu, properties);
} catch(e) {
Main.notify("tamos", e.message);
}
   },

   _addInCorrectBox: function(box, actor, menu, properties) {
      box.add(actor, properties);
      box.add_actor(menu.actor);
   },

   removeAll: function() {
try {
      for(let i = 0; i < this.linesDragPlaces.length; i++) {
         this.linesDragPlaces[i].visible = false;
         this.actor.remove_actor(this.linesDragPlaces[i].actor);
      }
      this.oldLines = this.linesDragPlaces;
      this.linesDragPlaces = new Array();

      Mainloop.idle_add(Lang.bind(this, function() {
         if(this._dragPlaceholder) {
            let parentHolder = this._dragPlaceholder.actor.get_parent();
            if(parentHolder)
               parentHolder.remove_actor(this._dragPlaceholder.actor);
            this._dragPlaceholder = null;
         }
         this.favRefresh = true;
         //Remove all favorites
         let childrens;
         let  lastPos = this.oldLines.length;
         while(0 < lastPos) {
            lastPos--;
           //this.actor.remove_actor(this.linesDragPlaces[lastPos].actor);
           this.oldLines[lastPos].actor.get_children().forEach(Lang.bind(this, function (child) {
              child.destroy();
           }));
           this.oldLines[lastPos].actor.destroy();
           //this.oldLines.splice(lastPos, 1);
         }
         this.oldLines = null;
     }));
} catch(e) {
   Main.notify("err" + e.message);
}
   },

   _generateChildrenList: function() {
      let result = new Array();
      let childrens = this.actor.get_children();
      let childrensItems;
      for(let i = 0; i < childrens.length; i++) {
         childrensItems = childrens[i].get_children();
         for(let j = 0; j < childrensItems.length; j++) {
            result.push(childrensItems[j]);
         }
      }
      return result;
   },

   isInBorder: function(symbol, actor) {
      let childrens = this.actor.get_children();
      let childrensItems;
      let posX, posY;
      for(let i = 0; i < childrens.length; i++) {
         childrensItems = childrens[i].get_children();
         for(let j = 0; j < childrensItems.length; j++) {
            if(childrensItems[j] == actor)  {
               posY = i;
               posX = j;
               break;
            }
         }
         if(posX)
            break;
      }
      if(symbol == Clutter.KEY_Left)
         return (((this.isVertical)&&(posY == 0))||((!this.isVertical)&&(posX == 0)));
      if(symbol == Clutter.KEY_Right)
         return (((this.isVertical)&&(posY == childrens.length - 1))||((!this.isVertical)&&(posX == childrens[posY].get_children().length - 2)));
      if(symbol == Clutter.KEY_Down) {
         return (((this.isVertical)&&(posX  == childrens[posY].get_children().length - 2))||((!this.isVertical)&&(posY == childrens.length - 1)));
      }
      if(symbol == Clutter.KEY_Up)
         return (((this.isVertical)&&(posX == 0))||((!this.isVertical)&&(posY == 0)));
      return false;
   },

   navegateFavBox: function(symbol, actor) {
      let childrens = this.actor.get_children();
      let childrensItems;
      let posX, posY;
      for(let i = 0; i < childrens.length; i++) {
         childrensItems = childrens[i].get_children();
         for(let j = 0; j < childrensItems.length; j++) {
            if(childrensItems[j] == actor)  {
               posY = i;
               posX = j;
               break;
            }
         }
         if(posX)
            break;
      }
      if(this.isVertical) {
         if(symbol == Clutter.KEY_Up) {
            if(posX == 0)
               posX = childrens[posY].get_children().length - 2;
            else
               posX -= 2;
         }
         else if(symbol == Clutter.KEY_Down) {
            if(posX == childrens[posY].get_children().length - 2)
               posX = 0;
            else
               posX += 2;
         }
         else if(symbol == Clutter.KEY_Right) {
            if(posY == childrens.length - 1)
               posY = 0;
            else
               posY += 1;
         }
         else if(symbol == Clutter.KEY_Left) {
            if(posY == 0)
               posY = childrens.length - 1;
            else
               posY -= 1;
         }
      }
      else {
        if(symbol == Clutter.KEY_Up) {
            if(posY == 0)
               posY = childrens.length - 1;
            else
               posY -= 1;
         }
         else if(symbol == Clutter.KEY_Down) {
            if(posY == childrens.length - 1)
               posY = 0;
            else
               posY += 1;
         }
         else if(symbol == Clutter.KEY_Right) {
            if(posX == childrens[posY].get_children().length - 2)
               posX = 0;
            else
               posX += 2;
         }
         else if(symbol == Clutter.KEY_Left) {
            if(posX == 0)
               posX = childrens[posY].get_children().length - 2;
            else
               posX -= 2;
         }
      }
      let nextItem = null;
      if((childrens[posY])&&(childrens[posY].get_children()[posX]))
         nextItem = childrens[posY].get_children()[posX]
      if((!nextItem)&&(childrens[0])&&(childrens[0].get_children()[0]))
         nextItem = childrens[0].get_children()[0];
      if(nextItem)
         global.stage.set_key_focus(nextItem);
      return nextItem;
   }
};

function TransientButtonExtended(parent, parentScroll, pathOrCommand, iconSize, vertical, appWidth, appdesc) {
   this._init(parent, parentScroll, pathOrCommand, iconSize, vertical, appWidth, appdesc);
}

TransientButtonExtended.prototype = {
   __proto__: GenericApplicationButtonExtended.prototype,
    
   _init: function(parent, parentScroll, pathOrCommand, iconSize, vertical, appWidth, appdesc) {
      GenericApplicationButtonExtended.prototype._init.call(this, parent, parentScroll, this._createAppWrapper(pathOrCommand), false);
      this.iconSize = iconSize;
      let displayPath = pathOrCommand;
      if(pathOrCommand.charAt(0) == '~') {
         pathOrCommand = pathOrCommand.slice(1);
         pathOrCommand = GLib.get_home_dir() + pathOrCommand;
      }

      this.isPath = pathOrCommand.substr(pathOrCommand.length - 1) == '/';
      if(this.isPath) {
         this.path = pathOrCommand;
      } else {
         let n = pathOrCommand.lastIndexOf('/');
         if(n != 1) {
            this.path = pathOrCommand.substr(0, n);
         }
      }

      this.pathOrCommand = pathOrCommand;

      this.parent = parent;
      PopupMenu.PopupBaseMenuItem.prototype._init.call(this, {hover: false});

      let iconBox = new St.Bin();
      this.file = Gio.file_new_for_path(this.pathOrCommand);
      try {
         this.handler = this.file.query_default_handler(null);
         let icon_uri = this.file.get_uri();
         let fileInfo = this.file.query_info(Gio.FILE_ATTRIBUTE_STANDARD_TYPE, Gio.FileQueryInfoFlags.NONE, null);
         let contentType = Gio.content_type_guess(this.pathOrCommand, null);
         let themedIcon = Gio.content_type_get_icon(contentType[0]);
         this.icon = new St.Icon({gicon: themedIcon, icon_size: this.iconSize, icon_type: St.IconType.FULLCOLOR });
      } catch (e) {
         this.handler = null;
         let iconName = this.isPath ? 'gnome-folder' : 'unknown';
         this.icon = new St.Icon({icon_name: iconName, icon_size: this.iconSize, icon_type: St.IconType.FULLCOLOR });
         // @todo Would be nice to indicate we don't have a handler for this file.
      }
      this.actor.set_style_class_name('menu-application-button');

      

      this.labelName = new St.Label({ text: displayPath, style_class: 'menu-application-button-label' });
      this.labelDesc = new St.Label({ style_class: 'menu-application-button-label' });
      this.labelDesc.visible = false;
      this.container = new St.BoxLayout();
      this.textBox = new St.BoxLayout({ vertical: true });
      this.setTextMaxWidth(appWidth);
      this.setAppDescriptionVisible(appdesc);
      this.setVertical(vertical);

      this.textBox.add(this.labelName, { x_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: true });
      if(this.icon) {
         this.container.add(this.icon, { x_align: St.Align.MIDDLE, y_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: false });
         this.icon.realize();
      }
      this.container.add(this.textBox, { x_align: St.Align.MIDDLE, y_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: false });
      this.addActor(this.container);

      this.labelName.realize();
      this.labelDesc.realize();
      this.isDraggableApp = false;
    //  this._draggable = DND.makeDraggable(this.actor);
    //  this._draggable.connect('drag-end', Lang.bind(this, this._onDragEnd));
    //  this.isDraggableApp = true;
   },

   _onButtonReleaseEvent: function(actor, event) {
      if(event.get_button() == 1) {
         this.activate(event);
      }
      return true;
   },
    
   activate: function(event) {
      if(this.handler != null) {
         this.handler.launch([this.file], null);
      } else {
         // Try anyway, even though we probably shouldn't.
         try {
            Util.spawn(['gvfs-open', this.file.get_uri()]);
         } catch(e) {
            global.logError("No handler available to open " + this.file.get_uri());
         }   
      }
      this.parent.menu.close();
   },

   setIconSize: function (iconSize) {
      this.iconSize = iconSize;
      if(this.icon)
         this.icon.set_icon_size(this.iconSize);
   },

   setAppDescriptionVisible: function(visible) {
      this.labelDesc.visible = visible;
      this.labelDesc.set_text("");
   },

   setTextMaxWidth: function(maxWidth) {
      //this.textBox.set_width(maxWidth);
      this.textBox.style="max-width: "+maxWidth+"px;";
      this.textWidth = maxWidth;
   },

   setVertical: function(vertical) {
      this.container.set_vertical(vertical);
      let parentL = this.labelName.get_parent();
      if(parentL) parentL.remove_actor(this.labelName);
      parentL = this.labelDesc.get_parent();
      if(parentL) parentL.remove_actor(this.labelDesc);
      this.setTextMaxWidth(this.textWidth);
      if(vertical) {
         this.textBox.add(this.labelName, { x_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: true });
         this.textBox.add(this.labelDesc, { x_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: true });  
      }
      else {
         this.textBox.add(this.labelName, { x_align: St.Align.START, x_fill: false, y_fill: false, expand: true });
         this.textBox.add(this.labelDesc, { x_align: St.Align.START, x_fill: false, y_fill: false, expand: true });
      }
   },

   _onDragEnd: function() {
   /*   let [x, y, mask] = global.get_pointer();
      let reactiveActor = global.stage.get_actor_at_pos(Clutter.PickMode.REACTIVE, x, y);
      let allActor = global.stage.get_actor_at_pos(Clutter.PickMode.ALL, x, y);
      let typeName = "" + allActor;
      if((reactiveActor instanceof Clutter.Stage)&&(typeName.indexOf("MetaWindowGroup") != -1)) {
         try {
            if(this.app.isPlace) {
               this.app.make_desktop_file();
            } else {
               let file = Gio.file_new_for_path(this.app.get_app_info().get_filename());
               let destFile = Gio.file_new_for_path(USER_DESKTOP_PATH+"/"+this.app.get_id());
               file.copy(destFile, 0, null, function(){});
               // Need to find a way to do that using the Gio library, but modifying the access::can-execute attribute on the file object seems unsupported
               Util.spawnCommandLine("chmod +x \""+USER_DESKTOP_PATH+"/"+this.app.get_id()+"\"");
            }
            this.parent._refreshFavs();
            this.parent._onChangeAccessible();
            return true;
         } catch(e) {
            //Main.notify("err:", e.message);
            global.log(e);
         }
      }
      this.parent._refreshFavs();
      this.parent._onChangeAccessible();*/
      return false;
   },

  _createAppWrapper: function(pathOrCommand) {
      // We need this fake app to help appEnterEvent/appLeaveEvent 
      // work with our search result.
      this.app = {
         get_app_info: function() {
            this.appInfo = {
               get_filename: function() {
                  return pathOrCommand;
               }
            };
            return this.appInfo;
         },
         get_id: function() {
            return -1;
         },
         get_description: function() {
            return pathOrCommand;
         },
         get_name: function() {
            return  '';
         },
         is_window_backed: function() {
            return false;
         },
         create_icon_texture: function(appIconSize) {
            try {
               let contentType = Gio.content_type_guess(pathOrCommand, null);
               let themedIcon = Gio.content_type_get_icon(contentType[0]);
               return new St.Icon({gicon: themedIcon, icon_size: appIconSize, icon_type: St.IconType.FULLCOLOR });
            } catch (e) {
               let isPath = pathOrCommand.substr(pathOrCommand.length - 1) == '/';
               let iconName = isPath ? 'gnome-folder' : 'unknown';
               return new St.Icon({icon_name: iconName, icon_size: appIconSize, icon_type: St.IconType.FULLCOLOR });
            }
         }
      };
      return this.app;
   }
};


function SystemButton(parent, parentScroll, icon, title, description, hoverIcon, iconSize, haveText) {
   this._init(parent, parentScroll, icon, title, description, hoverIcon, iconSize, haveText);
}

SystemButton.prototype = {
   _init: function(parent, parentScroll, icon, title, description, hoverIcon, iconSize, haveText) {
      this.title = title;
      this.description = description;
      this.hoverIcon = hoverIcon;
      this.actor = new St.BoxLayout({ style_class:'menu-category-button', reactive: true, track_hover: true });
      this.popupButton = new SystemPopupButtom(parent, parentScroll, icon, title, description, iconSize, haveText);
      //this.popupButton.actor.style = "padding-top: "+(0)+"px;padding-bottom: "+(0)+"px;padding-left: "+(0)+"px;padding-right: "+(0)+"px;margin:auto;";
      this.actor.add(this.popupButton.actor, { x_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: true });
   },

   setIconVisible: function(haveIcon) {
      this.popupButton.setIconVisible(haveIcon);
   },

   setTheme: function(theme) {
      this.theme = theme;
      this.actor.set_style_class_name('menu-category-button');
      this.actor.add_style_class_name('menu-system-button-' + this.theme);
   },

   setTextVisible: function(haveText) {
      this.popupButton.setTextVisible(haveText);
   },

   setVertical: function(vertical) {
      this.actor.remove_actor(this.popupButton.actor);
      if(vertical)
         this.actor.add(this.popupButton.actor, { x_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: true });
      else
         this.actor.add(this.popupButton.actor, { x_align: St.Align.START, x_fill: false, y_fill: false, expand: true });
       this.popupButton.setVertical(vertical);
   },

   setIconSize: function(iconSize) {
      this.popupButton.setIconSize(iconSize);
   },

   setAction: function(actionCallBack) {
      this.actionCallBack = actionCallBack;
      this.actor.connect('button-press-event', Lang.bind(this, this.executeAction));
   },

   executeAction: function(actor, event) {
      if((this.actionCallBack)&&((!event)||(event.get_button()==1))) {
         this.setActive(false);
         this.actionCallBack();
      }
   },

   setActive: function(active) {
      this.popupButton.setActive(active);
      this.active = active;
      if(this.active) {
         this.actor.set_style_class_name('menu-category-button-selected');
         if(this.theme)
            this.actor.add_style_class_name('menu-system-button-' + this.theme + '-selected');
         this.hoverIcon.refresh(this.popupButton.icon);
         this.actor.add_style_pseudo_class('active');
      }
      else {
         this.actor.set_style_class_name('menu-category-button');
         if(this.theme)
            this.actor.add_style_class_name('menu-system-button-' + this.theme);
         this.hoverIcon.refreshFace();
         this.actor.remove_style_pseudo_class('active');
      }
   }
};

function SystemPopupButtom(parent, parentScroll, icon, title, description, iconSize, haveText) {
   this._init(parent, parentScroll, icon, title, description, iconSize, haveText);
}

SystemPopupButtom.prototype = {
   __proto__: GenericApplicationButtonExtended.prototype,

   _init: function(parent, parentScroll, icon, title, description, iconSize, haveText) {
      GenericApplicationButtonExtended.prototype._init.call(this, parent, parentScroll);
      this.actor.set_style_class_name('');
      this.iconSize = iconSize;
      this.icon = icon;
      this.title = title;
      this.description = description;
      this.active = false;
      
      this.container = new St.BoxLayout();
      this.iconObj = new St.Icon({icon_name: icon, icon_size: this.iconSize, icon_type: St.IconType.FULLCOLOR });
      if(this.iconObj) {
         this.container.add(this.iconObj, { x_align: St.Align.MIDDLE, y_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: false });
         this.iconObj.realize();
      }

      this.label = new St.Label({ text: this.title, style_class: 'menu-application-button-label' });
      this.label.clutter_text.line_wrap_mode = Pango.WrapMode.CHAR;//WORD_CHAR;
      this.label.clutter_text.ellipsize = Pango.EllipsizeMode.END;//NONE;
      this.label.clutter_text.set_line_alignment(Pango.Alignment.CENTER);
      this.textBox = new St.BoxLayout({ vertical: false });
      this.textBox.add(this.label, { x_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: true });
      this.setTextVisible(false);
      this.setIconVisible(true);
      this.container.add_actor(this.textBox);

      this.addActor(this.container);
      this.label.realize();

   },

   setIconVisible: function(haveIcon) {
      if(this.iconObj) {
         this.iconObj.visible = haveIcon;
      }
   },

   setTextVisible: function(haveText) {
      this.textBox.visible = haveText;
   },

   setVertical: function(vertical) {
      this.container.set_vertical(vertical);
   },

   setIconSize: function(iconSize) {
      this.iconSize = iconSize;
      if((this.icon)&&(this.iconObj)) {
         this.iconObj.set_icon_size(this.iconSize);
         this.iconObj.realize();
      }
   },

   setActive: function(active) {
      this.active = active;
   }
};

function ApplicationButtonExtended(parent, parentScroll, app, vertical, iconSize, iconSizeDrag, appWidth, appDesc) {
   this._init(parent, parentScroll, app, vertical, iconSize, iconSizeDrag, appWidth, appDesc);
}

ApplicationButtonExtended.prototype = {
   __proto__: GenericApplicationButtonExtended.prototype,
    
   _init: function(parent, parentScroll, app, vertical, iconSize, iconSizeDrag, appWidth, appDesc) {
      GenericApplicationButtonExtended.prototype._init.call(this, parent, parentScroll, app, true);

      this.iconSize = iconSize;
      this.iconSizeDrag = iconSizeDrag;
      this.category = new Array();
      this.actor.set_style_class_name('menu-application-button');
      this.icon = this.app.create_icon_texture(this.iconSize);
      this.name = this.app.get_name();
      this.labelName = new St.Label({ text: this.name , style_class: 'menu-application-button-label' });
      this.labelDesc = new St.Label({ style_class: 'menu-application-button-label' });
      this.labelDesc.visible = false;
      this.container = new St.BoxLayout();
      this.textBox = new St.BoxLayout({ vertical: true });
      this.setTextMaxWidth(appWidth);
      this.setAppDescriptionVisible(appDesc);
      this.setVertical(vertical);
      if(this.icon) {
         this.container.add(this.icon, { x_align: St.Align.MIDDLE, y_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: false });
         this.icon.realize();
      }
      this.container.add(this.textBox, { x_align: St.Align.MIDDLE, y_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: false });
      this.addActor(this.container);

      this.labelName.realize();
      this.labelDesc.realize();

      this._draggable = DND.makeDraggable(this.actor);
      this._draggable.connect('drag-end', Lang.bind(this, this._onDragEnd));
      this.isDraggableApp = true;
   },

   _onDragEnd: function() {
      let [x, y, mask] = global.get_pointer();
      let reactiveActor = global.stage.get_actor_at_pos(Clutter.PickMode.REACTIVE, x, y);
      let allActor = global.stage.get_actor_at_pos(Clutter.PickMode.ALL, x, y);
      let typeName = "" + allActor;
      if((reactiveActor instanceof Clutter.Stage)&&(typeName.indexOf("MetaWindowGroup") != -1)) {
         try {
            let file = Gio.file_new_for_path(this.app.get_app_info().get_filename());
            let destFile = Gio.file_new_for_path(USER_DESKTOP_PATH+"/"+this.app.get_id());
            file.copy(destFile, 0, null, function(){});
            // Need to find a way to do that using the Gio library, but modifying the access::can-execute attribute on the file object seems unsupported
            Util.spawnCommandLine("chmod +x \""+USER_DESKTOP_PATH+"/"+this.app.get_id()+"\"");
            this.parent._refreshFavs();
            this.parent._onChangeAccessible();
            return true;
         } catch(e) {
            //Main.notify("err:", e.message);
            global.log(e);
         }
      }
      this.parent._refreshFavs();
      this.parent._onChangeAccessible();
      return false;
   },

   setAppDescriptionVisible: function(visible) {
      this.labelDesc.visible = visible;
      if(this.app.get_description())
         this.labelDesc.set_text(this.app.get_description().split("\n")[0]);
   },

   setTextMaxWidth: function(maxWidth) {
      //this.textBox.set_width(maxWidth);
      this.textBox.style="max-width: "+maxWidth+"px;";
      this.textWidth = maxWidth;
   },

   setIconSize: function (iconSize) {
      this.iconSize = iconSize;
      if(this.icon) {
         let visible = this.icon.visible;
         this.container.remove_actor(this.icon);
         this.icon.destroy();
         this.icon = this.app.create_icon_texture(this.iconSize);
         this.icon.visible = visible;
         this.container.insert_actor(this.icon, 0);
      }
   }, 
 
   setVertical: function(vertical) {
      this.container.set_vertical(vertical);
      let parentL = this.labelName.get_parent();
      if(parentL) parentL.remove_actor(this.labelName);
      parentL = this.labelDesc.get_parent();
      if(parentL) parentL.remove_actor(this.labelDesc);
      this.setTextMaxWidth(this.textWidth);
      if(vertical) {
         this.textBox.add(this.labelName, { x_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: true });
         this.textBox.add(this.labelDesc, { x_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: true });  
      }
      else {
         this.textBox.add(this.labelName, { x_align: St.Align.START, x_fill: false, y_fill: false, expand: true });
         this.textBox.add(this.labelDesc, { x_align: St.Align.START, x_fill: false, y_fill: false, expand: true });
      }
   },
 
   get_app_id: function() {
      return this.app.get_id();
   },
    
   getDragActor: function() {
      /*let favorites = AppFavorites.getAppFavorites().getFavorites();
      let nbFavorites = favorites.length;
      let monitorHeight = Main.layoutManager.primaryMonitor.height;
      let real_size = (0.7*monitorHeight) / nbFavorites;
      let icon_size = 0.6*real_size;
      if(icon_size > this.iconSizeDrag) icon_size = this.iconSizeDrag;*/
      let icon_size = this.iconSize;
      if(this.iconSizeDrag < this.iconSize)
         icon_size = this.iconSizeDrag;
      return this.app.create_icon_texture(icon_size);
    },

    // Returns the original actor that should align with the actor
    // we show as the item is being dragged.
    getDragActorSource: function() {
       return this.actor;
    }
};

function PlaceButtonAccessibleExtended(parent, parentScroll, place, alterName, vertical, iconSize, appWidth, appDesc) {
   this._init(parent, parentScroll, place, alterName, vertical, iconSize, appWidth, appDesc);
}

PlaceButtonAccessibleExtended.prototype = {
   __proto__: GenericApplicationButtonExtended.prototype,

   _init: function(parent, parentScroll, place, alterName, vertical, iconSize, appWidth, appDesc) {
      GenericApplicationButtonExtended.prototype._init.call(this, parent, parentScroll, this._createAppWrapper(place, alterName),
                                                           (parent._listDevices().indexOf(place) == -1));
      this.iconSize = iconSize;
      this.parent = parent;
      this.place = place;
      this.alterName = alterName;

      this.actor.set_style_class_name('menu-application-button');
      this.nameEntry = new St.Entry({ name: 'menu-name-entry', hint_text: _("Type the new name..."), track_hover: true, can_focus: true });
      if((this.alterName)&&(this.alterName != ""))
         this.labelName = new St.Label({ text: this.alterName, style_class: 'menu-application-button-label' });
      else
         this.labelName = new St.Label({ text: this.place.name, style_class: 'menu-application-button-label' });
      this.labelDesc = new St.Label({ style_class: 'menu-application-button-label' });
      this.nameEntry.visible = false;
      this.labelDesc.visible = false;
      this.container = new St.BoxLayout();
      this.textBox = new St.BoxLayout({ vertical: true });
      this.setTextMaxWidth(appWidth);
      this.setAppDescriptionVisible(appDesc);
      this.setVertical(vertical);

      this.icon = this.place.iconFactory(this.iconSize);
      if(!this.icon)
         this.icon = new St.Icon({icon_name: "folder", icon_size: this.iconSize, icon_type: St.IconType.FULLCOLOR});
      if(this.icon) {
         this.container.add(this.icon, { x_align: St.Align.MIDDLE, y_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: false });
         this.icon.realize();
      }
      this.container.add(this.textBox, { x_align: St.Align.MIDDLE, y_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: false });
      this.addActor(this.container);

      this.labelName.realize();
      this.labelDesc.realize();

      this._draggable = DND.makeDraggable(this.actor);
      this._draggable.connect('drag-end', Lang.bind(this, this._onDragEnd));
      this.isDraggableApp = true;
   },

   _onButtonReleaseEvent: function (actor, event) {
      if(event.get_button()==1) {
         this.activate(event);
      }
      if(event.get_button()==3) {
         if((this.withMenu) && (!this.menu.isOpen)) {
            this.parent.closeApplicationsContextMenus(this.app, true);
         } else {
            this.editText(false);
         }
         this.toggleMenu();
      }  
      return true;
   },

   editText: function(edit) {
      if((edit)&&(!this.nameEntry.visible)) {
         this.nameEntry.set_text(this.labelName.get_text());
         this.nameEntry.visible = true;
         global.stage.set_key_focus(this.nameEntry);
         this.labelName.visible = false;
         this.labelDesc.visible = false;
      }
      else {
         if(this.nameEntry.get_text() != "") {
            global.stage.set_key_focus(this.parent.searchEntry);
            this.labelName.set_text(this.nameEntry.get_text());
            this.alterName = this.nameEntry.get_text();
            this.nameEntry.set_text("");
            this.parent.changePlaceName(this.place.id, this.alterName);
         } else
            global.stage.set_key_focus(this.actor);

         this.labelName.visible = true;
         this.labelDesc.visible = this.haveDesc;
         this.nameEntry.visible = false;
      }
   },

   setDefaultText: function() {
      global.stage.set_key_focus(this.parent.searchEntry);
      this.labelName.set_text(this.place.name);
      this.alterName = "";
      this.nameEntry.set_text("");
      this.parent.changePlaceName(this.place.id, this.alterName);
      this.labelName.visible = true;
      this.labelDesc.visible = this.haveDesc;
      this.nameEntry.visible = false;
   },

   setIconVisible: function(visible) {
      if(this.icon)
         this.icon.visible = visible;
   },

   setIconSize: function(iconSize) {
      this.iconSize = iconSize;
      if(this.icon) {
         let visible = this.icon.visible;
         this.container.remove_actor(this.icon);
         this.icon.destroy();
         this.icon = this.place.iconFactory(this.iconSize);
         if(!this.icon)
            this.icon = new St.Icon({icon_name: "folder", icon_size: this.iconSize, icon_type: St.IconType.FULLCOLOR});
         if(this.icon)
            this.container.insert_actor(this.icon, 0);
         this.icon.visible = visible;
      }
   },

   setAppDescriptionVisible: function(visible) {
      this.haveDesc = visible;
      this.labelDesc.visible = visible;
      if(this.app.get_description())
         this.labelDesc.set_text(this.app.get_description());
   },

   setTextMaxWidth: function(maxWidth) {
      //this.textBox.set_width(maxWidth);
      this.textBox.style="max-width: "+maxWidth+"px;";
      this.textWidth = maxWidth;
   },

   setVertical: function(vertical) {
      this.container.set_vertical(vertical);
      let parentL = this.labelName.get_parent();
      if(parentL) parentL.remove_actor(this.labelName);
      parentL = this.labelDesc.get_parent();
      if(parentL) parentL.remove_actor(this.labelDesc);
      parentL = this.nameEntry.get_parent();
      if(parentL) parentL.remove_actor(this.nameEntry);
      this.setTextMaxWidth(this.textWidth);
      if(vertical) {
         this.textBox.add(this.labelName, { x_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: true });
         this.textBox.add(this.labelDesc, { x_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: true });
         this.textBox.add(this.nameEntry, { x_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: true });     
      }
      else {
         this.textBox.add(this.labelName, { x_align: St.Align.START, x_fill: false, y_fill: false, expand: true });
         this.textBox.add(this.labelDesc, { x_align: St.Align.START, x_fill: false, y_fill: false, expand: true });
         this.textBox.add(this.nameEntry, { x_align: St.Align.START, x_fill: false, y_fill: false, expand: true });
      }
   },

   _onDragEnd: function() {
      let [x, y, mask] = global.get_pointer();
      let reactiveActor = global.stage.get_actor_at_pos(Clutter.PickMode.REACTIVE, x, y);
      let allActor = global.stage.get_actor_at_pos(Clutter.PickMode.ALL, x, y);
      let typeName = "" + allActor;
      if((reactiveActor instanceof Clutter.Stage)&&(typeName.indexOf("MetaWindowGroup") != -1)) {
         try {
            if(this.app.isPlace) {
               this.app.make_desktop_file();
            } else {
               let file = Gio.file_new_for_path(this.app.get_app_info().get_filename());
               let destFile = Gio.file_new_for_path(USER_DESKTOP_PATH+"/"+this.app.get_id());
               file.copy(destFile, 0, null, function(){});
               // Need to find a way to do that using the Gio library, but modifying the access::can-execute attribute on the file object seems unsupported
               Util.spawnCommandLine("chmod +x \""+USER_DESKTOP_PATH+"/"+this.app.get_id()+"\"");
            }
            this.parent._refreshFavs();
            this.parent._onChangeAccessible();
            return true;
         } catch(e) {
            //Main.notify("err:", e.message);
            global.log(e);
         }
      }
      this.parent._refreshFavs();
      this.parent._onChangeAccessible();
      return false;
   },

   _createAppWrapper: function(place, alterName) {
      // We need this fake app to help standar works.
      this.app = {
         isPlace: {
         },
         get_app_info: function() {
            this.appInfo = {
               get_filename: function() {
                  if(place.id.indexOf("bookmark:") == -1)
                     return toAscciiFromHex(place.id.slice(13));
                  return toAscciiFromHex(place.id.slice(16));
               }
            };
            return this.appInfo;
         },
         open_new_window: function(open) {
            place.launch();
         },
         is_window_backed: function() {
            return false;
         },
         get_id: function() {
            return place.id;
         },
         get_description: function() {
            if(place.id.indexOf("bookmark:") == -1)
               return toAscciiFromHex(place.id.slice(13));
            return toAscciiFromHex(place.id.slice(16));
         },
         get_name: function() {
            if((alterName)&&(alterName != ""))
               return toAscciiFromHex(alterName);
            return toAscciiFromHex(place.name);
         },
         create_icon_texture: function(appIconSize) {
            return place.iconFactory(appIconSize);
         },
         get_icon_name: function() {
            try {
               let icon = place.iconFactory(20);
               if(icon) {
                  let icon_name = icon.get_icon_name();
                  icon.destroy();
                  return icon.get_icon_name();
               }
               return place.get_icon_name();
            } catch(e) {};
            try {
               let path = this.get_description(); //try to find the correct Image for a special folder.
               if(path == GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_DOCUMENTS))
                  return "folder-documents";
               if(path == GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_PICTURES))
                  return "folder-pictures";
               if(path == GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_MUSIC))
                  return "folder-music";
               if(path == GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_VIDEOS))
                  return "folder-video";
               if(path == GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_DOWNLOAD))
                  return "folder-download";
               if(path == GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_TEMPLATES))
                  return "folder-templates";
               if(path == GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_PUBLIC_SHARE))
                  return "folder-publicshare";
            } catch(e) {};  
            return "folder";
         },
         make_desktop_file: function() {
            let name = toUTF8FromAscii(this.get_name());
            let path = toUTF8FromAscii(this.get_app_info().get_filename());
            let raw_file = "[Desktop Entry]\n" + "Name=" + name + "\n" + "Comment=" + path + "\n" +
                           "Exec=xdg-open \"" + path + "\"\n" + "Icon=" + this.get_icon_name() +
                           "\n" + "Terminal=false\n" + "StartupNotify=true\n" + "Type=Application\n" +
                           "Actions=Window;\n" + "NoDisplay=true";
            let desktopFile = Gio.File.new_for_path(USER_DESKTOP_PATH+"/"+name+".desktop");
            let fp = desktopFile.create(0, null);
            fp.write(raw_file, null);
            fp.close;
            Util.spawnCommandLine("chmod +x \""+USER_DESKTOP_PATH+"/"+name+".desktop\"");
         }
      };
      return this.app;
   }
};

function PlaceButtonExtended(parent, parentScroll, place, vertical, iconSize, appWidth, appDesc) {
   this._init(parent, parentScroll, place, vertical, iconSize, appWidth, appDesc);
}

PlaceButtonExtended.prototype = {
   __proto__: PlaceButtonAccessibleExtended.prototype,

   _init: function(parent, parentScroll, place, vertical, iconSize, appWidth, appDesc) {
      PlaceButtonAccessibleExtended.prototype._init.call(this, parent, parentScroll, place, "", vertical, iconSize, appWidth, appDesc);
      this.actor._delegate = this;
   },

   get_app_id: function() {
      return this.app.get_id();
   },
    
   getDragActor: function() {
      let icon_size = this.iconSize;
     // if(this.iconSizeDrag < this.iconSize)
     //    icon_size = this.iconSizeDrag;
      return this.app.create_icon_texture(icon_size);
    },

    // Returns the original actor that should align with the actor
    // we show as the item is being dragged.
    getDragActorSource: function() {
       return this.actor;
    }
};

function RecentButtonExtended(parent, file, vertical, iconSize, appWidth, appDesc) {
   this._init(parent, file, vertical, iconSize, appWidth, appDesc);
}

RecentButtonExtended.prototype = {
   __proto__: PopupMenu.PopupBaseMenuItem.prototype,

   _init: function(parent, file, vertical, iconSize, appWidth, appDesc) {
      PopupMenu.PopupBaseMenuItem.prototype._init.call(this, {hover: false});
      this.iconSize = iconSize;
      this.file = file;
      this.parent = parent;
      this.button_name = this.file.name;
      this.actor.set_style_class_name('menu-application-button');
      this.actor._delegate = this;
      this.labelName = new St.Label({ text: this.button_name, style_class: 'menu-application-button-label' });
      this.labelDesc = new St.Label({ style_class: 'menu-application-button-label' });
      this.labelDesc.visible = false;
      this.container = new St.BoxLayout();
      this.textBox = new St.BoxLayout({ vertical: true });
      this.setTextMaxWidth(appWidth);
      this.setAppDescriptionVisible(appDesc);
      this.setVertical(vertical);

      this.icon = file.createIcon(this.iconSize);
      if(this.icon) {
         this.container.add(this.icon, { x_align: St.Align.MIDDLE, y_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: false });
         this.icon.realize();
      }
      this.container.add(this.textBox, { x_align: St.Align.MIDDLE, y_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: false });
      this.addActor(this.container);

      this.labelName.realize();
      this.labelDesc.realize();
   },

   _onButtonReleaseEvent: function(actor, event) {
      if(event.get_button() == 1) {
         Gio.app_info_launch_default_for_uri(this.file.uri, global.create_app_launch_context());
         this.parent.menu.close();
      }
   },

   activate: function(event) {
      Gio.app_info_launch_default_for_uri(this.file.uri, global.create_app_launch_context());
      this.parent.menu.close();
   },

   setIconSize: function(iconSize) {
      this.iconSize = iconSize;
      if(this.icon)
         this.icon.set_icon_size(this.iconSize);
   },

   setTextMaxWidth: function(maxWidth) {
      //this.textBox.set_width(maxWidth);
      this.textBox.style="max-width: "+maxWidth+"px;";
      this.textWidth = maxWidth;
   },

   setAppDescriptionVisible: function(visible) {
      this.labelDesc.visible = visible;
      if(this.file.uri.slice(7))
         this.labelDesc.set_text(this.file.uri.slice(7));
   },

   setVertical: function(vertical) {
      this.container.set_vertical(vertical);
      let parentL = this.labelName.get_parent();
      if(parentL) parentL.remove_actor(this.labelName);
      parentL = this.labelDesc.get_parent();
      if(parentL) parentL.remove_actor(this.labelDesc);
      this.setTextMaxWidth(this.textWidth);
      if(vertical) {
         this.textBox.add(this.labelName, { x_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: true });
         this.textBox.add(this.labelDesc, { x_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: true });  
      }
      else {
         this.textBox.add(this.labelName, { x_align: St.Align.START, x_fill: false, y_fill: false, expand: true });
         this.textBox.add(this.labelDesc, { x_align: St.Align.START, x_fill: false, y_fill: false, expand: true });
      }
   }
};

function RecentClearButtonExtended(parent, vertical, iconSize, appWidth, appDesc) {
   this._init(parent, vertical, iconSize, appWidth, appDesc);
}

RecentClearButtonExtended.prototype = {
   __proto__: CinnamonMenu.RecentClearButton.prototype,

   _init: function(parent, vertical, iconSize, appWidth, appDesc) {
      PopupMenu.PopupBaseMenuItem.prototype._init.call(this, {hover: false});
      this.iconSize = iconSize;
      this.parent = parent;
      this.actor.set_style_class_name('menu-application-button');
      this.button_name = _("Clear list");
      this.actor._delegate = this;
      this.labelName = new St.Label({ text: this.button_name, style_class: 'menu-application-button-label' });
      this.labelDesc = new St.Label({ style_class: 'menu-application-button-label' });
      this.labelDesc.visible = false;
      this.container = new St.BoxLayout();
      this.textBox = new St.BoxLayout({ vertical: true });
      this.setTextMaxWidth(appWidth);
      this.setAppDescriptionVisible(appDesc);
      this.setVertical(vertical);

      this.icon = new St.Icon({ icon_name: 'edit-clear', icon_type: St.IconType.SYMBOLIC, icon_size: this.iconSize });
      this.container.add(this.icon, { x_align: St.Align.MIDDLE, y_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: false });
      this.container.add(this.textBox, { x_align: St.Align.MIDDLE, y_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: false });

      this.addActor(this.container);      
      this.icon.realize();
      this.labelName.realize();
      this.labelDesc.realize();
   },

   _onButtonReleaseEvent: function (actor, event) {
      if(event.get_button() == 1) {
         this.parent.menu.close();
         let GtkRecent = new Gtk.RecentManager();
         GtkRecent.purge_items();
      }
   },

   activate: function(event) {
      this.parent.menu.close();
      let GtkRecent = new Gtk.RecentManager();
      GtkRecent.purge_items();
   },

   setIconSize: function (iconSize) {
      this.iconSize = iconSize;
      if(this.icon)
         this.icon.set_icon_size(this.iconSize);
   },

   setTextMaxWidth: function(maxWidth) {
      //this.textBox.set_width(maxWidth);
      this.textBox.style="max-width: "+maxWidth+"px;";
      this.textWidth = maxWidth;
   },

   setAppDescriptionVisible: function(visible) {
      this.labelDesc.visible = visible;
      this.labelDesc.set_text("");
   },

   setVertical: function(vertical) {
      this.container.set_vertical(vertical);
      let parentL = this.labelName.get_parent();
      if(parentL) parentL.remove_actor(this.labelName);
      parentL = this.labelDesc.get_parent();
      if(parentL) parentL.remove_actor(this.labelDesc);
      this.setTextMaxWidth( this.textWidth);
      if(vertical) {
         this.textBox.add(this.labelName, { x_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: true });
         this.textBox.add(this.labelDesc, { x_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: true });  
      }
      else {
         this.textBox.add(this.labelName, { x_align: St.Align.START, x_fill: false, y_fill: false, expand: true });
         this.textBox.add(this.labelDesc, { x_align: St.Align.START, x_fill: false, y_fill: false, expand: true });
      }
   }
};

function FavoritesButtonExtended(parent, parentScroll, vertical, displayVertical, app, alterText, nbFavorites, iconSize, allowName, appWidth, appDesc, maxWidth) {
   this._init(parent, parentScroll, vertical, displayVertical, app, alterText, nbFavorites, iconSize, allowName, appWidth, appDesc, maxWidth);
}

FavoritesButtonExtended.prototype = {
   __proto__: GenericApplicationButtonExtended.prototype,
    
   _init: function(parent, parentScroll, vertical, displayVertical, app, alterName, nbFavorites, iconSize, allowName, appWidth, appDesc, maxWidth) {
      GenericApplicationButtonExtended.prototype._init.call(this, parent, parentScroll, app, true);
      this.iconSize = iconSize;
      this.displayVertical = displayVertical;
      this.vertical = vertical;
      this.allowName = allowName;
      this.nbFavorites = nbFavorites;
      this.alterName = alterName;

      this.container = new St.BoxLayout();
      let icon_size = this.iconSize;
      if(!this.allowName) {
         let monitor = Main.layoutManager.findMonitorForActor(this.actor);
         let monitorHeight;
         if(this.displayVertical)
            monitorHeight = monitor.height;
         else
            monitorHeight = monitor.width;
         let real_size = (0.7*monitorHeight) / this.nbFavorites;
         icon_size = 0.7*real_size;
         if(icon_size > this.iconSize) icon_size = this.iconSize;
      }
      this.actor.add_style_class_name('menu-favorites-button');
      this.actor.style = "padding-top: "+5+"px;padding-bottom: "+5+"px;padding-left: "+4+"px;padding-right: "+4+"px;margin:auto;";

      this.icon = app.create_icon_texture(icon_size);
      
      if(this.allowName) {
         this.container.set_width(maxWidth);
         if(this.icon) {
            this.container.add(this.icon, { x_align: St.Align.MIDDLE, y_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: false });
            this.icon.realize();
         }
         this.nameEntry = new St.Entry({ name: 'menu-name-entry', hint_text: _("Type the new name..."), track_hover: true, can_focus: true });
         if((this.alterName)&&(this.alterName != ""))
            this.labelName = new St.Label({ text: this.alterName, style_class: 'menu-application-button-label' });
         else
            this.labelName = new St.Label({ text: this.app.get_name(), style_class: 'menu-application-button-label' });
         this.labelDesc = new St.Label({ style_class: 'menu-application-button-label' });
         this.nameEntry.visible = false;
         this.labelDesc.visible = false;

         this.textBox = new St.BoxLayout({ vertical: true });
         this.setTextMaxWidth(appWidth);
         this.setAppDescriptionVisible(appDesc);
         this.container.add(this.textBox, { x_align: St.Align.MIDDLE, y_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: false });
         this.setVertical(vertical);
         this.labelName.realize();
         this.labelDesc.realize();
      } else if(this.icon) {
         this.container.add(this.icon, { x_align: St.Align.MIDDLE, y_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: true });
         this.icon.realize();
      }
      this.addActor(this.container);

      this._draggable = DND.makeDraggable(this.actor);
      this._draggable.connect('drag-end', Lang.bind(this, this._onDragEnd));  
      this.isDraggableApp = true;
   },

   editText: function(edit) {
      if((edit)&&(!this.nameEntry.visible)) {
         this.nameEntry.set_text(this.labelName.get_text());
         this.nameEntry.visible = true;
         global.stage.set_key_focus(this.nameEntry);
         this.labelName.visible = false;
         this.labelDesc.visible = false;
      }
      else {
         if(this.nameEntry.get_text() != "") {
            global.stage.set_key_focus(this.parent.searchEntry);
            this.labelName.set_text(this.nameEntry.get_text());
            this.alterName = this.nameEntry.get_text();
            this.nameEntry.set_text("");
            this.parent.changeAppName(this.app.get_id(), this.alterName);
         } else
            global.stage.set_key_focus(this.actor);

         this.labelName.visible = true;
         this.labelDesc.visible = this.haveDesc;
         this.nameEntry.visible = false;
      }
   },

   setDefaultText: function() {
      global.stage.set_key_focus(this.parent.searchEntry);
      this.labelName.set_text(this.app.get_name());
      this.alterName = "";
      this.nameEntry.set_text("");
      this.parent.changeAppName(this.app.get_id(), this.alterName);
      this.labelName.visible = true;
      this.labelDesc.visible = this.haveDesc;
      this.nameEntry.visible = false;
   },

   setIconVisible: function(visible) {
      if(this.icon)
         this.icon.visible = visible;
   },

   setIconSize: function(iconSize) {
      this.iconSize = iconSize;
      if(this.icon) {
         if(!this.allowName) {
            let monitor = Main.layoutManager.findMonitorForActor(this.actor);
            let monitorHeight;
            if(this.displayVertical)
               monitorHeight = monitor.height;
            else
               monitorHeight = monitor.width;
            let real_size = (0.7*monitorHeight) / this.nbFavorites;
            let icon_size = 0.7*real_size;
            if(icon_size > this.iconSize) icon_size = this.iconSize;
         }
         let visible = this.icon.visible;
         if(this.icon.get_parent() == this.container)
            this.container.remove_actor(this.icon);
         this.icon.destroy();
         this.icon = this.app.create_icon_texture(this.iconSize);
         if(this.icon) {
            this.container.insert_actor(this.icon, 0);
            this.icon.visible = visible;
         }
      }
   },

   setTextMaxWidth: function(maxWidth) {
      //this.textBox.set_width(maxWidth);
      this.textBox.style="max-width: "+maxWidth+"px;";
      this.textWidth = maxWidth;
   },

   setAppDescriptionVisible: function(visible) {
      this.haveDesc = visible;
      if(this.allowName) { 
         this.labelDesc.visible = visible;
         if(this.app.get_description())
            this.labelDesc.set_text(this.app.get_description().split("\n")[0]);
      }
   },

   setVertical: function(vertical) {
      this.container.set_vertical(vertical);
      this.setTextMaxWidth( this.textWidth);
      if(this.allowName) {      
         let parentL = this.labelName.get_parent();
         if(parentL) parentL.remove_actor(this.labelName);
         parentL = this.labelDesc.get_parent();
         if(parentL) parentL.remove_actor(this.labelName);
         parentL = this.nameEntry.get_parent();
         if(parentL) parentL.remove_actor(this.nameEntry);
         if(vertical) {
            this.textBox.add(this.labelName, { x_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: true });
            this.textBox.add(this.nameEntry, { x_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: true });  
            this.textBox.add(this.labelDesc, { x_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: true });
            
         }
         else {
            this.textBox.add(this.labelName, { x_align: St.Align.START, x_fill: false, y_fill: false, expand: true });
            this.textBox.add(this.nameEntry, { x_align: St.Align.START, x_fill: false, y_fill: false, expand: true });
            this.textBox.add(this.labelDesc, { x_align: St.Align.START, x_fill: false, y_fill: false, expand: true });
         }
      }
   },

   _onDragEnd: function(actor, time, acepted) {
      let [x, y, mask] = global.get_pointer();
      let reactiveActor = global.stage.get_actor_at_pos(Clutter.PickMode.REACTIVE, x, y);
      let allActor = global.stage.get_actor_at_pos(Clutter.PickMode.ALL, x, y);
      let typeName = "" + allActor;
      if((reactiveActor instanceof Clutter.Stage)&&(typeName.indexOf("MetaWindowGroup") != -1)) {
         try {
            if(this.app.isPlace) {
               this.app.make_desktop_file();
            } else {
               let file = Gio.file_new_for_path(this.app.get_app_info().get_filename());
               let destFile = Gio.file_new_for_path(USER_DESKTOP_PATH+"/"+this.app.get_id());
               file.copy(destFile, 0, null, function(){});
               // Need to find a way to do that using the Gio library, but modifying the access::can-execute attribute on the file object seems unsupported
               Util.spawnCommandLine("chmod +x \""+USER_DESKTOP_PATH+"/"+this.app.get_id()+"\"");
            }
            this.parent._refreshFavs();
            this.parent._onChangeAccessible();
            return true;
         } catch(e) {
            //Main.notify("err:", e.message);
            global.log(e);
         }
      }
      this.parent._refreshFavs();
      this.parent._onChangeAccessible();
      return false;
   }
};

function CategoryButtonExtended(app, iconSize, iconVisible) {
   this._init(app, iconSize, iconVisible);
}

CategoryButtonExtended.prototype = {
   __proto__: PopupMenu.PopupBaseMenuItem.prototype,

   _init: function(category, iconSize, iconVisible) {
      PopupMenu.PopupBaseMenuItem.prototype._init.call(this, {hover: false});
      this.iconSize = iconSize;
      this.actor.set_style_class_name('menu-category-button');
      this.actor.add_style_class_name('menu-category-button-' + this.theme);
      var label;
      let icon = null;
      if(category) {
         icon = category.get_icon();
         if(icon && icon.get_names)
            this.icon_name = icon.get_names().toString();
         else
            this.icon_name = "";
         label = category.get_name();
      } else
         label = _("All Applications");
        
      this.actor._delegate = this;
      this.label = new St.Label({ text: label, style_class: 'menu-category-button-label' });
      this.label.clutter_text.line_wrap_mode = Pango.WrapMode.CHAR;//WORD_CHAR;
      this.label.clutter_text.ellipsize = Pango.EllipsizeMode.END;//NONE;
      this.label.clutter_text.set_line_alignment(Pango.Alignment.CENTER);
      this.container = new St.BoxLayout();
      this.textBox = new St.BoxLayout({ vertical: false });
      this.setVertical(false);

      this.textBox.add(this.label, { x_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: true });
      if(category && this.icon_name) {
         this.icon = St.TextureCache.get_default().load_gicon(null, icon, this.iconSize);
         if(this.icon) {
            this.container.add(this.icon, { x_align: St.Align.MIDDLE, y_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: false });
            this.icon.realize();
         }
      }
      this.container.add(this.textBox, { x_align: St.Align.MIDDLE, y_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: false });

      this.addActor(this.container);
      this.label.realize();
      this.setIconVisible(iconVisible);
   },

   setIconVisible: function (visible) {
      if(this.icon)
         this.icon.visible = visible;
   },

   setIconSize: function (iconSize) {
      this.iconSize = iconSize;
      if(this.icon)
         this.icon.set_icon_size(this.iconSize);
   },

   setVertical: function(vertical) {
      this.container.set_vertical(vertical);
    /*  this.label.clutter_text.line_wrap = vertical;
      if(vertical) {
         this.textBox.set_width(88);
         this.textBox.set_height(32);    
      }
      else {
         this.textBox.set_width(-1);
         this.textBox.set_height(-1);
      }*/
   }
};

function PlaceCategoryButtonExtended(app, iconSize, iconVisible) {
    this._init(app, iconSize, iconVisible);
}

PlaceCategoryButtonExtended.prototype = {
   __proto__: PopupMenu.PopupBaseMenuItem.prototype,

   _init: function(category, iconSize, iconVisible) {
      PopupMenu.PopupBaseMenuItem.prototype._init.call(this, {hover: false});
      this.iconSize = iconSize;
      this.actor.set_style_class_name('menu-category-button');
      this.actor.add_style_class_name('menu-category-button-' + this.theme);
      this.actor._delegate = this;
      this.label = new St.Label({ text: _("Places"), style_class: 'menu-category-button-label' });
      this.label.clutter_text.line_wrap_mode = Pango.WrapMode.CHAR;//WORD_CHAR;
      this.label.clutter_text.ellipsize = Pango.EllipsizeMode.END;//NONE;
      this.label.clutter_text.set_line_alignment(Pango.Alignment.CENTER);
      this.container = new St.BoxLayout();
      this.textBox = new St.BoxLayout({ vertical: false });
      this.setVertical(false);

      this.textBox.add(this.label, { x_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: true });
      this.icon = new St.Icon({icon_name: "folder", icon_size: this.iconSize, icon_type: St.IconType.FULLCOLOR});
      if(this.icon) {
         this.container.add(this.icon, { x_align: St.Align.MIDDLE, y_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: false });
         this.icon.realize();
      }
      this.container.add(this.textBox, { x_align: St.Align.MIDDLE, y_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: false });

      this.addActor(this.container);
      this.icon.realize();
      this.label.realize();
      this.setIconVisible(iconVisible);
   },

   setIconVisible: function(visible) {
      if(this.icon)
         this.icon.visible = visible;
   },

   setIconSize: function (iconSize) {
      this.iconSize = iconSize;
      if(this.icon)
         this.icon.set_icon_size(this.iconSize);
   },

   setVertical: function(vertical) {
      this.container.set_vertical(vertical);
     /* this.label.clutter_text.line_wrap = vertical;
      if(vertical) {
         this.textBox.set_width(88);
         this.textBox.set_height(32);    
      }
      else {
         this.textBox.set_width(-1);
         this.textBox.set_height(-1);
      }*/
   }
};

function RecentCategoryButtonExtended(app, iconSize, iconVisible) {
   this._init(app, iconSize, iconVisible);
}

RecentCategoryButtonExtended.prototype = {
   __proto__: PopupMenu.PopupBaseMenuItem.prototype,

   _init: function(category, iconSize, iconVisible) {
      PopupMenu.PopupBaseMenuItem.prototype._init.call(this, {hover: false});
      this.iconSize = iconSize;
      this.actor.set_style_class_name('menu-category-button');
      this.actor.add_style_class_name('menu-category-button-' + this.theme);
      this.actor._delegate = this;
      this.label = new St.Label({ text: _("Recent Files"), style_class: 'menu-category-button-label' });
      this.label.clutter_text.line_wrap_mode = Pango.WrapMode.CHAR;//WORD_CHAR;
      this.label.clutter_text.ellipsize = Pango.EllipsizeMode.END;//NONE;
      this.label.clutter_text.set_line_alignment(Pango.Alignment.CENTER);
      this.container = new St.BoxLayout();
      this.textBox = new St.BoxLayout({ vertical: false });
      this.setVertical(false);

      this.textBox.add(this.label, { x_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: true });
      this.icon = new St.Icon({icon_name: "folder-recent", icon_size: this.iconSize, icon_type: St.IconType.FULLCOLOR});
      if(this.icon) {
         this.container.add(this.icon, { x_align: St.Align.MIDDLE, y_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: false });
         this.icon.realize();
      }
      this.container.add(this.textBox, { x_align: St.Align.MIDDLE, y_align: St.Align.MIDDLE, x_fill: false, y_fill: false, expand: false });

      this.addActor(this.container);

      this.label.realize();
      this.setIconVisible(iconVisible);
   },

   setIconVisible: function(visible) {
      if(this.icon)
         this.icon.visible = visible;
   },

   setIconSize: function (iconSize) {
      this.iconSize = iconSize;
      if(this.icon)
         this.icon.set_icon_size(this.iconSize);
   },

   setVertical: function(vertical) {
      this.container.set_vertical(vertical);
     /* this.label.clutter_text.line_wrap = vertical;
      if(vertical) {
         this.textBox.set_width(88);
         this.textBox.set_height(32);    
      }
      else {
         this.textBox.set_width(-1);
         this.textBox.set_height(-1);
      }*/
   }
};

function ConfigurablePointer(arrowSide, binProperties) {
   this._init(arrowSide, binProperties);
}

ConfigurablePointer.prototype = {
   __proto__: BoxPointer.BoxPointer.prototype,

   _init: function(arrowSide, binProperties) {
      BoxPointer.BoxPointer.prototype._init.call (this, arrowSide, binProperties);
      this.riseArrow = true;
      this.fixCorner = false;
      this.resizeSize = 0;
      try {
         let [res, selectedColor] = Clutter.Color.from_string("#505050");
         this.selectedColor = selectedColor;
      } catch (e) {
         let selectedColor = new Clutter.Color();
         selectedColor.from_string("#505050");
         this.selectedColor = selectedColor;
      }
   },

   setArrow: function(arrow) {
      this.riseArrow = arrow;
      this._border.queue_repaint();
   },

   fixToCorner: function(actor, fixCorner) {
      this.fixCorner = fixCorner;
      //this.setPosition(actor, this._arrowAlignment);
      this._border.queue_repaint();
   },

   setResizeArea: function(resizeSize) {
      this.resizeSize = resizeSize;
      this._border.queue_repaint();
   },

   setResizeAreaColor: function(resizeColor) {
      try {
         let [res, selectedColor] = Clutter.Color.from_string(resizeColor);
         this.selectedColor = selectedColor;
      } catch (e) {
         let selectedColor = new Clutter.Color();
         selectedColor.from_string(resizeColor);
         this.selectedColor = selectedColor;
      }
      this._border.queue_repaint();
   },

   _reposition: function(sourceActor, alignment) {
      // Position correctly relative to the sourceActor
      let sourceNode = sourceActor.get_theme_node();
      let sourceContentBox = sourceNode.get_content_box(sourceActor.get_allocation_box());
      let sourceAllocation = Cinnamon.util_get_transformed_allocation(sourceActor);
      let sourceCenterX = sourceAllocation.x1 + sourceContentBox.x1 + (sourceContentBox.x2 - sourceContentBox.x1) * this._sourceAlignment;
      let sourceCenterY = sourceAllocation.y1 + sourceContentBox.y1 + (sourceContentBox.y2 - sourceContentBox.y1) * this._sourceAlignment;
      let [minWidth, minHeight, natWidth, natHeight] = this.actor.get_preferred_size();

      // We also want to keep it onscreen, and separated from the
      // edge by the same distance as the main part of the box is
      // separated from its sourceActor
      let monitor = Main.layoutManager.findMonitorForActor(sourceActor);
      let themeNode = this.actor.get_theme_node();
      let borderWidth = themeNode.get_length('-arrow-border-width');
      let arrowBase = themeNode.get_length('-arrow-base');
      let borderRadius = themeNode.get_length('-arrow-border-radius');
      let margin = (4 * borderRadius + borderWidth + arrowBase);
      let halfMargin = margin / 2;

      let themeNode = this.actor.get_theme_node();
      let gap = themeNode.get_length('-boxpointer-gap');

      let resX, resY;

      switch (this._arrowSide) {
      case St.Side.TOP:
          resY = sourceAllocation.y2 + gap;
          break;
      case St.Side.BOTTOM:
          resY = sourceAllocation.y1 - natHeight - gap;
          break;
      case St.Side.LEFT:
          resX = sourceAllocation.x2 + gap;
          break;
      case St.Side.RIGHT:
          resX = sourceAllocation.x1 - natWidth - gap;
          break;
      }

      // Now align and position the pointing axis, making sure
      // it fits on screen
      switch (this._arrowSide) {
      case St.Side.TOP:
      case St.Side.BOTTOM:
         resX = sourceCenterX - (halfMargin + (natWidth - margin) * alignment);

         resX = Math.max(resX, monitor.x + 10);
         resX = Math.min(resX, monitor.x + monitor.width - (10 + natWidth));
         this.setArrowOrigin(sourceCenterX - resX);
         break;

      case St.Side.LEFT:
      case St.Side.RIGHT:
         resY = sourceCenterY - (halfMargin + (natHeight - margin) * alignment);

         resY = Math.max(resY, monitor.y + 10);
         resY = Math.min(resY, monitor.y + monitor.height - (10 + natHeight));

         this.setArrowOrigin(sourceCenterY - resY);
         break;
      }

      let parent = this.actor.get_parent();
      let success, x, y;
      while(!success) {
         [success, x, y] = parent.transform_stage_point(resX, resY);
         parent = parent.get_parent();
      }
        
      if(this.fixCorner) {
         if(sourceAllocation.x1 < 1) {
            this._xOffset = -x - themeNode.get_length('border-left');
         }
         else if(Math.abs(sourceAllocation.x2 - monitor.x - monitor.width) < 1) {
            this._xOffset = 10 + themeNode.get_length('border-right');
         }
         if(this._arrowSide == St.Side.TOP) {
            this._yOffset = -themeNode.get_length('border-top') - gap + borderWidth - 1 - themeNode.get_length('padding-top') - themeNode.get_length('padding-bottom');
         } else if(this._arrowSide == St.Side.BOTTOM) {
            this._yOffset = themeNode.get_length('border-bottom') + gap + borderWidth + themeNode.get_length('padding-top') + themeNode.get_length('padding-bottom');
         }
         // Main.notify("x:" + x + " x1:" + sourceAllocation.x1 + " x2:" + sourceAllocation.x2 + " main:" + (monitor.x - monitor.width));
         //  Main.notify("y:" + y + " y1:" + sourceAllocation.y1 + " y2:" + sourceAllocation.y2 + " main:" + (monitor.x - monitor.height)); 
      } else {
         this._xOffset = 0;
         this._yOffset = 0;
      }

      this._xPosition = Math.floor(x);
      this._yPosition = Math.floor(y);
      this._shiftActor();
   },

   _drawBorder: function(area) {
      let themeNode = this.actor.get_theme_node();

      let borderWidth = themeNode.get_length('-arrow-border-width');
      let base = themeNode.get_length('-arrow-base');
      let rise = 0;
      if(this.riseArrow)
         rise = themeNode.get_length('-arrow-rise');

      let borderRadius = themeNode.get_length('-arrow-border-radius');

      let halfBorder = borderWidth / 2;
      let halfBase = Math.floor(base/2);

      let borderColor = themeNode.get_color('-arrow-border-color');
      let backgroundColor = themeNode.get_color('-arrow-background-color');

      let [width, height] = area.get_surface_size();
      let [boxWidth, boxHeight] = [width, height];
      if(this._arrowSide == St.Side.TOP || this._arrowSide == St.Side.BOTTOM) {
         boxHeight -= rise;
      } else {
         boxWidth -= rise;
      }
      let cr = area.get_context();
      Clutter.cairo_set_source_color(cr, borderColor);

      // Translate so that box goes from 0,0 to boxWidth,boxHeight,
      // with the arrow poking out of that
      if(this._arrowSide == St.Side.TOP) {
         cr.translate(0, rise);
      } else if (this._arrowSide == St.Side.LEFT) {
         cr.translate(rise, 0);
      }

      let [x1, y1] = [halfBorder, halfBorder];
      let [x2, y2] = [boxWidth - halfBorder, boxHeight - halfBorder];

      cr.moveTo(x1 + borderRadius, y1);
      if(this._arrowSide == St.Side.TOP) {
         if(this._arrowOrigin < (x1 + (borderRadius + halfBase))) {
            cr.lineTo(this._arrowOrigin, y1 - rise);
            cr.lineTo(Math.max(x1 + borderRadius, this._arrowOrigin) + halfBase, y1);
         } else if(this._arrowOrigin > (x2 - (borderRadius + halfBase))) {
            cr.lineTo(Math.min(x2 - borderRadius, this._arrowOrigin) - halfBase, y1);
            cr.lineTo(this._arrowOrigin, y1 - rise);
         } else {
            cr.lineTo(this._arrowOrigin - halfBase, y1);
            cr.lineTo(this._arrowOrigin, y1 - rise);
            cr.lineTo(this._arrowOrigin + halfBase, y1);
         }
      }

      cr.lineTo(x2 - borderRadius, y1);

      // top-right corner
      cr.arc(x2 - borderRadius, y1 + borderRadius, borderRadius,
             3*Math.PI/2, Math.PI*2);

      if(this._arrowSide == St.Side.RIGHT) {
         if(this._arrowOrigin < (y1 + (borderRadius + halfBase))) {
            cr.lineTo(x2 + rise, this._arrowOrigin);
            cr.lineTo(x2, Math.max(y1 + borderRadius, this._arrowOrigin) + halfBase);
         } else if(this._arrowOrigin > (y2 - (borderRadius + halfBase))) {
            cr.lineTo(x2, Math.min(y2 - borderRadius, this._arrowOrigin) - halfBase);
            cr.lineTo(x2 + rise, this._arrowOrigin);
         } else {
            cr.lineTo(x2, this._arrowOrigin - halfBase);
            cr.lineTo(x2 + rise, this._arrowOrigin);
            cr.lineTo(x2, this._arrowOrigin + halfBase);
         }
      }

      cr.lineTo(x2, y2 - borderRadius);

      // bottom-right corner
      cr.arc(x2 - borderRadius, y2 - borderRadius, borderRadius,
             0, Math.PI/2);

      if(this._arrowSide == St.Side.BOTTOM) {
         if(this._arrowOrigin < (x1 + (borderRadius + halfBase))) {
            cr.lineTo(Math.max(x1 + borderRadius, this._arrowOrigin) + halfBase, y2);
            cr.lineTo(this._arrowOrigin, y2 + rise);
         } else if(this._arrowOrigin > (x2 - (borderRadius + halfBase))) {
            cr.lineTo(this._arrowOrigin, y2 + rise);
            cr.lineTo(Math.min(x2 - borderRadius, this._arrowOrigin) - halfBase, y2);
         } else {
            cr.lineTo(this._arrowOrigin + halfBase, y2);
            cr.lineTo(this._arrowOrigin, y2 + rise);
            cr.lineTo(this._arrowOrigin - halfBase, y2);
         }
      }

      cr.lineTo(x1 + borderRadius, y2);

      // bottom-left corner
      cr.arc(x1 + borderRadius, y2 - borderRadius, borderRadius,
             Math.PI/2, Math.PI);

      if(this._arrowSide == St.Side.LEFT) {
         if(this._arrowOrigin < (y1 + (borderRadius + halfBase))) {
            cr.lineTo(x1, Math.max(y1 + borderRadius, this._arrowOrigin) + halfBase);
            cr.lineTo(x1 - rise, this._arrowOrigin);
         } else if(this._arrowOrigin > (y2 - (borderRadius + halfBase))) {
            cr.lineTo(x1 - rise, this._arrowOrigin);
            cr.lineTo(x1, Math.min(y2 - borderRadius, this._arrowOrigin) - halfBase);
         } else {
            cr.lineTo(x1, this._arrowOrigin + halfBase);
            cr.lineTo(x1 - rise, this._arrowOrigin);
            cr.lineTo(x1, this._arrowOrigin - halfBase);
         }
      }

      cr.lineTo(x1, y1 + borderRadius);

      // top-left corner
      cr.arc(x1 + borderRadius, y1 + borderRadius, borderRadius,
             Math.PI, 3*Math.PI/2);

      Clutter.cairo_set_source_color(cr, backgroundColor);
      cr.fillPreserve();
      Clutter.cairo_set_source_color(cr, borderColor);
      cr.setLineWidth(borderWidth);
      cr.stroke();

      if(this.resizeSize > 0) {
         let maxSpace = Math.max(this.resizeSize, borderRadius);
         let monitor = Main.layoutManager.findMonitorForActor(this._sourceActor);
         let center = (monitor.x + monitor.width)/2;
         let sourceAllocation = Cinnamon.util_get_transformed_allocation(this._sourceActor);

         if(this._arrowSide == St.Side.BOTTOM) {
            if(sourceAllocation.x1 < center) {
               cr.moveTo(x2 - maxSpace - borderWidth, y1 - borderWidth);
               cr.lineTo(x2 + borderWidth, y1 + maxSpace + borderWidth);
               cr.lineTo(x2 + borderWidth, y1 - borderWidth);
               cr.lineTo(x2 - maxSpace - borderWidth, y1 - borderWidth);
            } else {
               cr.moveTo(x1 + maxSpace + borderWidth, y1 - borderWidth);
               cr.lineTo(x1 - borderWidth, y1 + maxSpace + borderWidth);
               cr.lineTo(x1 - borderWidth, y1 - borderWidth);
               cr.lineTo(x1 + maxSpace + borderWidth, y1 - borderWidth);
            }
         } else {
            if(sourceAllocation.x1 < center) {
               cr.moveTo(x2 + borderWidth, y2 - maxSpace - borderWidth);
               cr.lineTo(x2 - maxSpace - borderWidth, y2 + borderWidth);
               cr.lineTo(x2 + borderWidth, y2 + borderWidth);
               cr.lineTo(x2 + borderWidth, y2 - maxSpace - borderWidth);
            } else {
               cr.moveTo(x1 - borderWidth, y2 - maxSpace - borderWidth);
               cr.lineTo(x1 + maxSpace + borderWidth, y2 + borderWidth);
               cr.lineTo(x1 - borderWidth, y2 + borderWidth);
               cr.lineTo(x1 - borderWidth, y2 - maxSpace - borderWidth);
            }
         }
         try {
         Clutter.cairo_set_source_color(cr, this.selectedColor);
         cr.fillPreserve();
         Clutter.cairo_set_source_color(cr, borderColor);
         cr.setLineWidth(1);
         cr.stroke();
         } catch(e) {
            Main.notify("error", e.message);
         }
      }
   }
};

function ConfigurableMenu(launcher, orientation) {
   this._init(launcher, orientation);
}

ConfigurableMenu.prototype = {
   __proto__: Applet.AppletPopupMenu.prototype,

   _init: function(launcher, orientation) {
      PopupMenu.PopupMenuBase.prototype._init.call (this, launcher.actor, 'popup-menu-content');

      this._arrowAlignment = 0.0;
      this._arrowSide = orientation;

      this._boxPointer = new ConfigurablePointer(orientation,
                                                 { x_fill: true,
                                                   y_fill: true,
                                                   x_align: St.Align.START });
      this.actor = this._boxPointer.actor;
      this.actor._delegate = this;
      this.actor.style_class = 'popup-menu-boxpointer';
      this.actor.connect('key-press-event', Lang.bind(this, this._onKeyPressEvent));

      this._boxWrapper = new Cinnamon.GenericContainer();
      this._boxWrapper.connect('get-preferred-width', Lang.bind(this, this._boxGetPreferredWidth));
      this._boxWrapper.connect('get-preferred-height', Lang.bind(this, this._boxGetPreferredHeight));
      this._boxWrapper.connect('allocate', Lang.bind(this, this._boxAllocate));
      this._boxPointer.bin.set_child(this._boxWrapper);
      this._boxWrapper.add_actor(this.box);
      this.actor.add_style_class_name('popup-menu');

      global.focus_manager.add_group(this.actor);
      this.actor.reactive = true;

      Main.uiGroup.add_actor(this.actor);
      this.actor.hide();     
   },

   setArrow: function(arrow) {
      this._boxPointer.setArrow(arrow);
   },

   fixToCorner: function(fixCorner) {
      this._boxPointer.fixToCorner(this.sourceActor, fixCorner);
   },

   setResizeArea: function(resizeSize) {
      this._boxPointer.setResizeArea(resizeSize);
   },

   setResizeAreaColor: function(resizeColor) {
      this._boxPointer.setResizeAreaColor(resizeColor);
   }
};

function SpecialBookmarks(name, icon, path) {
   this._init(name, icon, path);
}

SpecialBookmarks.prototype = {

   _init: function(name, icon, path) {
      this.name = name;
      this._icon = icon;
      this._path = path;
      this.id = "bookmark:file://" + this._path;
   },

   launch: function() {
      Util.spawnCommandLine('xdg-open ' + this._path);
   },

   iconFactory: function(iconSize) {
      return new St.Icon({icon_name: this._icon, icon_size: iconSize, icon_type: St.IconType.FULLCOLOR});
   },

   get_icon_name: function() {
      return this._icon;
   }
};

function MyApplet(metadata, orientation, panel_height, instance_id) {
   this._init(metadata, orientation, panel_height, instance_id);
}

MyApplet.prototype = {
   __proto__: CinnamonMenu.MyApplet.prototype,

   _init: function(metadata, orientation, panel_height, instance_id) {
      Applet.TextIconApplet.prototype._init.call(this, orientation, panel_height, instance_id);
      try {
         this.deltaMinResize = 20;
         this.aviableWidth = 0;
         this.uuid = metadata["uuid"];
         this.allowFavName = false;
         this.iconAppSize = 22;
         this.iconCatSize = 22;
         this.iconMaxFavSize = 20;
         this.iconPowerSize = 20;
         this.iconHoverSize = 68;
         this.iconAccessibleSize = 68;
         this.iconView = false;
         this.iconViewCount = 1;
         this.favoritesLinesNumber = 1;
         this.orientation = orientation;
         this._searchIconClickedId = 0;
         this._applicationsButtons = new Array();
         this._applicationsButtonFromApp = new Object();
         this._favoritesButtons = new Array();
         this._placesButtons = new Array();
         this._transientButtons = new Array();
         this._recentButtons = new Array();
         this._categoryButtons = new Array();
         this._selectedItemIndex = null;
         this._previousTreeItemIndex = null;
         this._previousSelectedActor = null;
         this._previousVisibleIndex = null;
         this._previousTreeSelectedActor = null;
         this._activeContainer = null;
         this._activeActor = null;
         this._applicationsBoxWidth = 0;
         this.menuIsOpening = false;
         this.signalKeyPowerID = 0;
         this.showTimeDate = false;
         this.timeFormat = "%H:%M";
         this.dateFormat = "%A,%e %B";
         this.appTitleSize = 10;
         this.appDescriptionSize = 8;
         this.showAppTitle = true;
         this.showAppDescription = true;
         this.controlingSize = false;
         this.minimalWidth = -1;
         this.minimalHeight = -1;

         this.execInstallLanguage();
         //_ = Gettext.domain(this.uuid).gettext;
         Gettext.bindtextdomain(this.uuid, GLib.get_home_dir() + "/.local/share/locale");

         this.set_applet_tooltip(_("Menu"));
         this.RecentManager = new DocInfo.DocManager();

         this.menu = new ConfigurableMenu(this, orientation);
         this.menu.actor.connect('motion-event', Lang.bind(this, this._onResizeMotionEvent));
         this.menu.actor.connect('button-press-event', Lang.bind(this, this._onBeginResize));
         this.menu.actor.connect('leave-event', Lang.bind(this, this._disableOverResizeIcon));
         this.menu.actor.connect('button-release-event', Lang.bind(this, this._disableResize));
         this.menu.connect('open-state-changed', Lang.bind(this, this._onOpenStateChanged));
         this.menu.actor.add_style_class_name('menu-background');


         this.menuManager = new PopupMenu.PopupMenuManager(this);
         this.menuManager.addMenu(this.menu);   
         this.actor.connect('key-press-event', Lang.bind(this, this._onSourceKeyPress));
         this.actor.connect('button-release-event', Lang.bind(this, this._onButtonReleaseEvent));
         this.actor.connect('button-press-event', Lang.bind(this, this._onButtonPressEvent));
         //this._keyFocusNotifyIDSignal = global.stage.connect('notify::key-focus', Lang.bind(this, this._onKeyFocusChanged));

         this.settings = new Settings.AppletSettings(this, this.uuid, instance_id);

         this.settings.bindProperty(Settings.BindingDirection.IN, "theme", "theme", this._onSelectedThemeChange, null);

         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "show-recent", "showRecent", this._refreshPlacesAndRecent, null);
         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "show-places", "showPlaces", this._refreshPlacesAndRecent, null);
         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "activate-on-hover", "activateOnHover",this._updateActivateOnHover, null);                        
         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "menu-icon", "menuIcon", this._updateIconAndLabel, null);
         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "menu-label", "menuLabel", this._updateIconAndLabel, null);
         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "search-filesystem", "searchFilesystem", null, null);
         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "swap-panels", "swapPanels", this._onSwapPanel, null);
         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "hover-delay", "hover_delay_ms", this._update_hover_delay, null);
         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "enable-autoscroll", "autoscroll_enabled", this._update_autoscroll, null);

         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "power-theme", "powerTheme", this._onThemePowerChange, null);
         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "gnomenu-buttons-theme", "gnoMenuButtonsTheme", this._onThemeGnoMenuButtonsChange, null);
         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "show-view-item", "showView", this._setVisibleViewControl, null);
         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "control-symbolic", "controlSymbolic", this._setControlButtonsSymbolic, null);

         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "view-item", "iconView", this._changeView, null);

         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "activate-on-press", "activateOnPress", null, null);

         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "hover-box", "showHoverIconBox", this._setVisibleHoverIconBox, null);
         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "control-box", "showControlBox", this._setVisibleControlBox, null);
         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "power-box", "showPowerBox", this._setVisiblePowerBox, null);
         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "accessible-box", "showAccessibleBox", this._setVisibleAccessibleBox, null);
         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "gnomenu-box", "showGnoMenuBox", this._setVisibleGnoMenuBox, null);

         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "show-removable-drives", "showRemovable", this._setVisibleRemovable, null);
         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "accessible-icons", "showAccessibleIcons", this._setVisibleAccessibleIcons, null);
         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "categories-icons", "showCategoriesIcons", this._setVisibleCategoriesIcons, null);

         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "app-button-width", "textButtonWidth", this._changeView, null);
         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "app-description", "appButtonDescription", this._changeView, null);

         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "icon-app-size", "iconAppSize", this._onAppsChange, null);
         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "icon-cat-size", "iconCatSize", this._onAppsChange, null);
         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "icon-max-fav-size", "iconMaxFavSize", this._setIconMaxFavSize, null);
         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "icon-power-size", "iconPowerSize", this._setIconPowerSize, null);
         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "icon-control-size", "iconControlSize", this._setIconControlSize, null);
         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "icon-hover-size", "iconHoverSize", this._setIconHoverSize, null);
         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "icon-accessible-size", "iconAccessibleSize", this._setIconAccessibleSize, null);
         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "icon-gnomenu-size", "iconGnoMenuSize", this._setIconGnoMenuSize, null);
         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "show-favorites", "showFavorites", this._setVisibleFavorites, null);
         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "favorites-lines", "favoritesLinesNumber", this._setVisibleFavorites, null);

         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "show-hover-icon", "showHoverIcon", this._setVisibleHoverIcon, null);
         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "show-power-buttons", "showPowerButtons", this._setVisiblePowerButtons, null);
         
         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "show-time-date", "showTimeDate", this._setVisibleTimeDate, null);
         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "time-format", "timeFormat", this._updateTimeDateFormat, null);
         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "date-format", "dateFormat", this._updateTimeDateFormat, null);

         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "show-app-title", "showAppTitle", this._updateAppSelectedText, null);
         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "app-title-size", "appTitleSize", this._updateAppSelectedText, null);
         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "show-app-description", "showAppDescription", this._updateAppSelectedText, null);
         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "app-description-size", "appDescriptionSize", this._updateAppSelectedText, null);

         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "automatic-size", "automaticSize", this._setAutomaticSize, null);
         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "full-screen", "fullScreen", this._setFullScreen, null);
         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "width", "width", this._updateSize, null);
         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "height", "height", this._updateSize, null);

         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "scroll-favorites", "scrollFavoritesVisible", this._setVisibleScrollFav, null);
         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "scroll-categories", "scrollCategoriesVisible", this._setVisibleScrollCat, null);
         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "scroll-applications", "scrollApplicationsVisible", this._setVisibleScrollApp, null);
         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "scroll-accessible", "scrollAccessibleVisible", this._setVisibleScrollAccess, null);
         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "scroll-gnomenu", "scrollGnoMenuVisible", this._setVisibleScrollGnoMenu, null);

         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "spacer-line", "showSpacerLine", this._setVisibleSpacerLine, null);
         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "spacer-size", "spacerSize", this._updateSpacerSize, null);

         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "show-box-pointer", "showBoxPointer", this._setVisibleBoxPointer, null);
         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "fix-menu-corner", "fixMenuCorner", this._setFixMenuCorner, null);
//Config//
         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "list-places", "stringPlaces", null, null);
         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "list-places-names", "stringPlacesNames", null, null);
         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "list-apps", "stringApps", null, null);
         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "list-apps-names", "stringAppsNames", null, null);

         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "classic", "stringClassic", null, null);
         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "gnomenuLeft", "stringGnoMenuLeft", null, null);
         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "gnomenuRight", "stringGnoMenuRight", null, null);
         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "gnomenuTop", "stringGnoMenuTop", null, null);
         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "gnomenuBottom", "stringGnoMenuBottom", null, null);
         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "vampire", "stringVampire", null, null);
         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "garibaldo", "stringGaribaldo", null, null);
         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "stylized", "stringStylized", null, null);
         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "dragon", "stringDragon", null, null);
         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "dragonInverted", "stringDragonInverted", null, null);
         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "horizontal", "stringHorizontal", null, null);
         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "accessible", "stringAccessible", null, null);
         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "accessibleInverted", "stringAccessibleInverted", null, null);
         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "mint", "stringMint", null, null);
         this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "windows7", "stringWindows7", null, null);
//Config//

         this._searchInactiveIcon = new St.Icon({ style_class: 'menu-search-entry-icon',
                                                  icon_name: 'edit-find',
                                                  icon_type: St.IconType.SYMBOLIC });
         this._searchActiveIcon = new St.Icon({ style_class: 'menu-search-entry-icon',
                                                icon_name: 'edit-clear',
                                                icon_type: St.IconType.SYMBOLIC });

         appsys.connect('installed-changed', Lang.bind(this, this._onAppsChange));
         //AppFavorites.getAppFavorites().connect('changed', Lang.bind(this, this._refreshFavs));
         AppFavorites.getAppFavorites().connect('changed', Lang.bind(this, this._updateAppFavs));

         global.display.connect('overlay-key', Lang.bind(this, function() {
            try {
               this.menu.toggle_with_options(false);
            }
            catch(e) {
               global.logError(e);
            }
         }));
         Main.placesManager.connect('places-updated', Lang.bind(this, this._refreshPlacesAndRecent));
         Main.themeManager.connect('theme-set', Lang.bind(this, this._updateSize));
         St.TextureCache.get_default().connect("icon-theme-changed", Lang.bind(this, this._onThemeChange));
         this.RecentManager.connect('changed', Lang.bind(this, this._refreshPlacesAndRecent));

         this._fileFolderAccessActive = false;
         this._pathCompleter = new Gio.FilenameCompleter();
         this._pathCompleter.set_dirs_only(false);
         this.lastAcResults = new Array();

         this._updateConfig();
         this._updateComplete();
      }
      catch (e) {
         Main.notify("ErrorMain:", e.message);
         global.logError(e);
      }
   },

   _isDirectory: function(fDir) {
      try {
         let info = fDir.query_filesystem_info("standard::type", null);
         if((info)&&(info.get_file_type() != Gio.FileType.DIRECTORY))
            return true;
      } catch(e) {
      }
      return false;
   },

   _makeDirectoy: function(fDir) {
      if(!this._isDirectory(fDir))
         this._makeDirectoy(fDir.get_parent());
      if(!this._isDirectory(fDir))
         fDir.make_directory(null);
   },

   execInstallLanguage: function() {
      try {
         let _shareFolder = GLib.get_home_dir() + "/.local/share/";
         let _localeFolder = Gio.file_new_for_path(_shareFolder + "locale/");
         let _moFolder = Gio.file_new_for_path(_shareFolder + "cinnamon/applets/" + this.uuid + "/locale/mo/");

         let children = _moFolder.enumerate_children('standard::name,standard::type',
                                          Gio.FileQueryInfoFlags.NONE, null);
         let info, child, _moFile, _moLocale, _moPath;
                   
         while ((info = children.next_file(null)) != null) {
            let type = info.get_file_type();
            if (type == Gio.FileType.REGULAR) {
               _moFile = info.get_name();
               if (_moFile.substring(_moFile.lastIndexOf(".")) == ".mo") {
                  _moLocale = _moFile.substring(0, _moFile.lastIndexOf("."));
                  _moPath = _localeFolder.get_path() + "/" + _moLocale + "/LC_MESSAGES/";
                  let src = Gio.file_new_for_path(String(_moFolder.get_path() + "/" + _moFile));
                  let dest = Gio.file_new_for_path(String(_moPath + this.uuid + ".mo"));
                  try {
                     //if(!this.equalsFile(dest.get_path(), src.get_path())) {
                        this._makeDirectoy(dest.get_parent());
                        src.copy(dest, Gio.FileCopyFlags.OVERWRITE, null, null);
                     //}
                  } catch(e) {
                     Main.notify("Error", e.message);
                  }
               }
            }
         }
      } catch(e) {
         Main.notify("Error", e.message);
      }
   },
//Config//
   _updateConfig: function() {
      this._readAccessiblePlaces();
      this._readAccessiblePlacesNames();
      this._readAccessibleApps();
      this._readAccessibleAppsNames();
      this._createArrayOfThemes();
      this._updateValues();
   },

   _updateValues: function() {
       let newSettingsThemes = this._readDefaultSettings();
       let newThemeConfig, oldPropTheme, settingPropTheme;
       for(theme in this.themes) {
           settingPropTheme = this._getThemeProperties(newSettingsThemes[theme]);
           oldPropTheme = this._getThemeProperties(this.themes[theme]);
           for(let keyPropSetting in settingPropTheme) {
              if(!oldPropTheme[keyPropSetting]) {
                 oldPropTheme[keyPropSetting] = settingPropTheme[keyPropSetting];
              }
           }
           let newPropTheme = new Array();
           for(let keyPropOld in oldPropTheme) {
              if(settingPropTheme[keyPropOld]) {
                 newPropTheme[keyPropOld] = oldPropTheme[keyPropOld];
              }
           }
           newThemeConfig = this._makeThemeConvertion(newPropTheme);
           this.setThemeConfig(theme, newThemeConfig);
       }
   },

   _readDefaultSettings: function() {
      let newSettings = new Array();
      let new_json;
      try {
         let orig_file_path = GLib.get_home_dir() + "/.local/share/cinnamon/applets/" + this.uuid + "/settings-schema.json";
         let init_file_contents = Cinnamon.get_file_contents_utf8_sync(orig_file_path);
         new_json = JSON.parse(init_file_contents);
         for(let key in new_json) {
            if(new_json[key]["type"] == "generic") {
               if((new_json[key] != "list-places")&&(new_json[key] != "list-apps")&&
                  (new_json[key] != "list-places-names")&&(new_json[key] != "list-apps-names")) {
                  newSettings[key] = new_json[key]["default"];
               }
            }
         }
      } catch (e) {
         global.logError("Problem parsing " + orig_file.get_path() + " while preparing to perform an upgrade.");
         global.logError("Skipping upgrade for now - something may be wrong with the new settings schema file.");
      }
      return newSettings;
   },

   _createArrayOfThemes: function() {
      this.themes = new Array();
      this.themes["classic"] = this.stringClassic;
      this.themes["gnomenuLeft"] = this.stringGnoMenuLeft;
      this.themes["gnomenuRight"] = this.stringGnoMenuRight;
      this.themes["gnomenuTop"] = this.stringGnoMenuTop;
      this.themes["gnomenuBottom"] = this.stringGnoMenuBottom;
      this.themes["vampire"] = this.stringVampire;
      this.themes["garibaldo"] = this.stringGaribaldo;
      this.themes["stylized"] = this.stringStylized;
      this.themes["dragon"] = this.stringDragon;
      this.themes["dragonInverted"] = this.stringDragonInverted;
      this.themes["horizontal"] = this.stringHorizontal;
      this.themes["accessible"] = this.stringAccessible;
      this.themes["accessibleInverted"] = this.stringAccessibleInverted;
      this.themes["mint"] = this.stringMint;
      this.themes["windows7"] = this.stringWindows7;
   },

   _saveTheme: function(theme) {
      switch(theme) {
         case "classic"            :
            this.stringClassic = this.themes["classic"]
            break;
         case "gnomenuLeft"        :
            this.stringGnoMenuLeft = this.themes["gnomenuLeft"];
            break;
         case "gnomenuRight"       :
            this.stringGnoMenuRight = this.themes["gnomenuRight"];
            break;
         case "gnomenuTop"         :
            this.stringGnoMenuTop = this.themes["gnomenuTop"];
            break;
         case "gnomenuBottom"      :
            this.stringGnoMenuBottom = this.themes["gnomenuBottom"];
            break;
         case "vampire"            :
            this.stringVampire = this.themes["vampire"];
            break;
         case "garibaldo"          :
            this.stringGaribaldo = this.themes["garibaldo"];
            break;
         case "stylized"           :
            this.stringStylized = this.themes["stylized"];
            break;
         case "dragon"             :
            this.stringDragon = this.themes["dragon"];
            break;
         case "dragonInverted"     :
            this.stringDragonInverted = this.themes["dragonInverted"];
            break;
         case "horizontal"         :
            this.stringHorizontal = this.themes["horizontal"];
            break;
         case "accessible"         :
            this.stringAccessible = this.themes["accessible"];
            break;
         case "accessibleInverted" :
            this.stringAccessibleInverted = this.themes["accessibleInverted"];
            break;
         case "mint"               :
            this.stringMint = this.themes["mint"];
            break;
         case "windows7"           :
            this.stringWindows7 = this.themes["windows7"];
            break;
      }
   },

   _readAccessiblePlaces: function() {
      this.places = this.stringPlaces.split(";;");
      let pos = 0;
      while(pos < this.places.length) {
         if((this.places[pos] == "")||(!this._isBookmarks(this.places[pos])))
            this.places.splice(pos, 1);
         else
            pos++;
      }
   },

   _readAccessiblePlacesNames: function() {
      let placesNamesList = this.stringPlacesNames.split(";;");
      this.placesNames = new Array();
      let property;
      for(let i = 0; i < placesNamesList.length; i++) {
         property = placesNamesList[i].split("::");
         if((property[0] != "")&&(property[1] != "")&&(this.places.indexOf(property[0]) != -1)) {
            this.placesNames[property[0]] = property[1];
         }
      }
   },

   _readAccessibleApps: function() {
      this.apps = this.stringApps.split(";;");
      let appSys = Cinnamon.AppSystem.get_default();
      let pos = 0;
      while(pos < this.apps.length) {
         if((this.apps[pos] == "")||(!appSys.lookup_app(this.apps[pos])))
            this.apps.splice(pos, 1);
         else
            pos++;
      }
   },

   _readAccessibleAppsNames: function() {
      let appsNamesList = this.stringAppsNames.split(";;");
      this.appsNames = new Array();
      let property;
      for(let i = 0; i < appsNamesList.length; i++) {
         property = appsNamesList[i].split("::");
         if((property[0] != "")&&(property[1] != "")&&(this.apps.indexOf(property[0]) != -1)) {
            this.appsNames[property[0]] = property[1];
         }
      }
   },

   _isBookmarks: function(bookmark) {
      let listBookmarks = this._listBookmarks();
      for(let i = 0; i < listBookmarks.length; i++) {
         if(listBookmarks[i].id == bookmark)
            return true;
      }
      return false;
   },

   getPlacesList: function() {
      return this.places;
   },

   setPlacesList: function(listPlaces) {
      let result = "";
      this.places = new Array();
      for(let i = 0; i < listPlaces.length - 1; i++) {
         if((listPlaces[i] != "")&&(this._isBookmarks(listPlaces[i]))&&(this.places.indexOf(listPlaces[i]) == -1)) {
            this.places.push(listPlaces[i]);
            result += listPlaces[i] + ";;";
         }
      }
      if(listPlaces.length > 0) {
         let last = listPlaces[listPlaces.length-1];
         if((last != "")&&(this._isBookmarks(last))&&(this.places.indexOf(last) == -1)) {
            this.places.push(last);
            result += last;
         }
      }
      this.stringPlaces = result;//commit
      this.setPlacesNamesList(this.getPlacesNamesList());
   },

   isInPlacesList: function(placeId) {
      return (this.places.indexOf(placeId) != -1);
   },

   getPlacesNamesList: function() {
      let newPlacesNames = new Array();
      for(id in this.placesNames) {
         if(this.places.indexOf(id) != -1)
            newPlacesNames[id] = this.placesNames[id];
      }
      return newPlacesNames;
   },

   setPlacesNamesList: function(listPlacesNames) {
      let result = "";
      this.placesNames = new Array();
      for(let id in listPlacesNames) {
         if((id != "")&&(listPlacesNames[id].toString() != "")&&(this.places.indexOf(id) != -1)) {
            this.placesNames[id] = listPlacesNames[id];
            result += id+"::"+listPlacesNames[id].toString() + ";;";
         }
      }
      this.stringPlacesNames = result.substring(0, result.length - 2);//commit
      this._onChangeAccessible();
   },

   changePlaceName: function(placeId, newName) {
      if(this.places.indexOf(placeId) != -1) {
         if(newName != "") {
            this.placesNames[placeId] = newName;
            this.setPlacesNamesList(this.placesNames);
         }
         else {
            let newPlaces = new Array();
            for(id in this.placesNames) {
               if(id != placeId)
                 newPlaces[id] = this.placesNames[id];
            }
            this.setPlacesNamesList(newPlaces);
         }
      }
   },

   getAppsNamesList: function() {
      let newAppsNames = new Array();
      for(id in this.appsNames) {
         if(this.apps.indexOf(id) != -1)
            newAppsNames[id] = this.appsNames[id];
      }
      return newAppsNames;
   },

   setAppsNamesList: function(listAppsNames) {
      let result = "";
      this.appsNames = new Array();
      for(let id in listAppsNames) {
         if((id != "")&&(listAppsNames[id].toString() != "")&&(this.apps.indexOf(id) != -1)) {
            this.appsNames[id] = listAppsNames[id].toString();
            result += id+"::"+listAppsNames[id].toString() + ";;";
         }
      }
      this.stringAppsNames = result.substring(0, result.length - 2);//commit
      this._onChangeAccessible();
   },

   changeAppName: function(appId, newName) {
      if(this.apps.indexOf(appId) != -1) {
         if(newName != "") {
            this.appsNames[appId] = newName;
            this.setAppsNamesList(this.appsNames);
         }
         else {
            let newApps = new Array();
            for(id in this.appsNames) {
               if(id != appId)
                 newApps[id] = this.appsNames[id];
            }
            this.setAppsNamesList(newApps);
         }
      }
   },

   getAppsList: function() {
      return this.apps;
   },

   setAppsList: function(listApps) {
      let result = "";
      this.apps = new Array();
      for(let i = 0; i < listApps.length - 1; i++) {
         if(listApps[i] != "") {
            result += listApps[i] + ";;";
            this.apps.push(listApps[i]);
         }
      }
      if((listApps.length > 0)&&(listApps[listApps.length-1] != "")) {
         result += listApps[listApps.length-1];
         this.apps.push(listApps[listApps.length-1]);
      }
      this.stringApps = result;//commit
      this.setAppsNamesList(this.getAppsNamesList());
   },

   isInAppsList: function(appId) {
      return (this.apps.indexOf(appId) != -1);
   },

   getThemeConfig: function(themeString) {
      let themeProperties = this._getThemeProperties(themeString)
      return this._makeThemeConvertion(themeProperties);
   },

   _getThemeProperties: function(themeString) {
      let themeList = themeString.split(";;");
      let themeProperties = new Array();
      let property;
      for(let i = 0; i < themeList.length; i++) {
         property = themeList[i].split("::");
         themeProperties[property[0]] = property[1];
      }
      return themeProperties;
   },

   _makeThemeConvertion: function(themeProperties) {
      themeProperties["show-recent"] = (themeProperties["show-recent"] === 'true');
      themeProperties["show-places"] = (themeProperties["show-places"] === 'true');
      themeProperties["search-filesystem"] = (themeProperties["search-filesystem"] === 'true');
      themeProperties["swap-panels"] = (themeProperties["swap-panels"] === 'true');
      themeProperties["activate-on-hover"] = (themeProperties["activate-on-hover"] === 'true');
      themeProperties["hover-delay"] = parseInt(themeProperties["hover-delay"]);
      themeProperties["enable-autoscroll"] = (themeProperties["enable-autoscroll"] === 'true');
      themeProperties["show-view-item"] = (themeProperties["show-view-item"] === 'true');
      themeProperties["control-symbolic"] = (themeProperties["control-symbolic"] === 'true');
      themeProperties["view-item"] = (themeProperties["view-item"] === 'true');
      themeProperties["hover-box"] = (themeProperties["hover-box"] === 'true');
      themeProperties["control-box"] = (themeProperties["control-box"] === 'true');
      themeProperties["power-box"] = (themeProperties["power-box"] === 'true');
      themeProperties["accessible-box"] = (themeProperties["accessible-box"] === 'true');
      themeProperties["gnomenu-box"] = (themeProperties["gnomenu-box"] === 'true');
      themeProperties["show-removable-drives"] = (themeProperties["show-removable-drives"] === 'true');
      themeProperties["accessible-icons"] = (themeProperties["accessible-icons"] === 'true');
      themeProperties["categories-icons"] = (themeProperties["categories-icons"] === 'true');
      themeProperties["app-button-width"] = parseInt(themeProperties["app-button-width"]);
      themeProperties["app-description"] = (themeProperties["app-description"] === 'true');
      themeProperties["icon-app-size"] = parseInt(themeProperties["icon-app-size"]);
      themeProperties["icon-cat-size"] = parseInt(themeProperties["icon-cat-size"]);
      themeProperties["icon-max-fav-size"] = parseInt(themeProperties["icon-max-fav-size"]);
      themeProperties["icon-power-size"] = parseInt(themeProperties["icon-power-size"]);
      themeProperties["icon-control-size"] = parseInt(themeProperties["icon-control-size"]);
      themeProperties["icon-hover-size"] = parseInt(themeProperties["icon-hover-size"]);
      themeProperties["icon-accessible-size"] = parseInt(themeProperties["icon-accessible-size"]);
      themeProperties["icon-gnomenu-size"] = parseInt(themeProperties["icon-gnomenu-size"]);
      themeProperties["show-favorites"] = (themeProperties["show-favorites"] === 'true');
      themeProperties["favorites-lines"] = parseInt(themeProperties["favorites-lines"]);
      themeProperties["show-hover-icon"] = (themeProperties["show-hover-icon"] === 'true');
      themeProperties["show-power-buttons"] = (themeProperties["show-power-buttons"] === 'true');
      themeProperties["show-time-date"] = (themeProperties["show-time-date"] === 'true');
      themeProperties["show-app-title"] = (themeProperties["show-app-title"] === 'true');
      themeProperties["app-title-size"] = parseInt(themeProperties["app-title-size"]);
      themeProperties["show-app-description"] = (themeProperties["show-app-description"] === 'true');
      themeProperties["app-description-size"] = parseInt(themeProperties["app-description-size"]);
      themeProperties["automatic-size"] = (themeProperties["automatic-size"] === 'true');
      themeProperties["full-screen"] = (themeProperties["full-screen"] === 'true');
      themeProperties["width"] = parseInt(themeProperties["width"]);
      themeProperties["height"] = parseInt(themeProperties["height"]);
      themeProperties["scroll-favorites"] = (themeProperties["scroll-favorites"] === 'true');
      themeProperties["scroll-categories"] = (themeProperties["scroll-categories"] === 'true');
      themeProperties["scroll-applications"] = (themeProperties["scroll-applications"] === 'true');
      themeProperties["scroll-accessible"] = (themeProperties["scroll-accessible"] === 'true');
      themeProperties["scroll-gnomenu"] = (themeProperties["scroll-gnomenu"] === 'true');
      themeProperties["spacer-line"] = (themeProperties["spacer-line"] === 'true');
      themeProperties["spacer-size"] = parseInt(themeProperties["spacer-size"]);
      themeProperties["show-box-pointer"] = (themeProperties["show-box-pointer"] === 'true');
      themeProperties["fix-menu-corner"] = (themeProperties["fix-menu-corner"] === 'true');
      return themeProperties;
   },

   setThemeConfig: function(theme, properties) {
      let result = "";
      for(let key in properties)
         result += key+"::"+properties[key].toString() + ";;";
      this.themes[theme] = result.substring(0, result.length - 2);
      this._saveTheme(theme);
   },
//Config//
   _updateAppFavs: function() {
      Mainloop.idle_add(Lang.bind(this, function() {
         this._refreshFavs();
      }));
   },

   _onAppsChange: function() {
      this._refreshApps();
      this._updateAppButtonDesc();
      this._updateTextButtonWidth();
      this._setAppIconDirection();
      this._updateAppSize();
      this._updateSize();
   },

   _onChangeAccessible: function() {
      if(this.accessibleBox) {
         this.accessibleBox.refreshAccessibleItems();
      }
   },

   on_orientation_changed: function(orientation) {
      this.orientation = orientation;
      this._updateComplete();   
   },

   _onMenuKeyPress: function(actor, event) {
      try {
//Main.notify("ok" + actor);
        let symbol = event.get_key_symbol();
        let item_actor;
        this.appBoxIter.reloadVisible();
        this.catBoxIter.reloadVisible();

        let keyCode = event.get_key_code();
        let modifierState = Cinnamon.get_event_state(event);

        /* check for a keybinding and quit early, otherwise we get a double hit
           of the keybinding callback */
        let action = global.display.get_keybinding_action(keyCode, modifierState);

        if (action == Meta.KeyBindingAction.CUSTOM) {
            return true;
        }

        if (global.display.get_is_overlay_key(keyCode, modifierState) && this.menu.isOpen) {
            this.menu.close();
            return true;
        }
        if((this.bttChanger)&&(this.bttChanger.getSelected() == _("All Applications"))&&(actor == this.searchEntryText)) {
           if((symbol != Clutter.Return) && (symbol != Clutter.KEY_Return) && (symbol != Clutter.KP_Enter) &&
              (symbol != Clutter.KEY_Right) && (symbol != Clutter.KEY_Up) && (symbol != Clutter.KEY_Down) &&
              (symbol != Clutter.KEY_Left) && (symbol != Clutter.Escape) && (symbol != Clutter.Tab))
              if(this.searchEntry.text == "")
                 this.bttChanger.activateNext();
        }
        if((this.gnoMenuBox)&&(this.gnoMenuBox.getSelected() != _("All Applications"))&&(actor == this.searchEntryText)) {
           if((symbol != Clutter.Return) && (symbol != Clutter.KEY_Return) && (symbol != Clutter.KP_Enter) &&
              (symbol != Clutter.KEY_Right) && (symbol != Clutter.KEY_Up) && (symbol != Clutter.KEY_Down) &&
              (symbol != Clutter.KEY_Left) && (symbol != Clutter.Escape) && (symbol != Clutter.Tab))
              if(this.searchEntry.text == "")
                 this.gnoMenuBox.setSelected(_("All Applications"));
        }

        if(actor._delegate instanceof FavoritesButtonExtended) {
           return this._navegateFavBox(symbol, actor);
        } else if(actor == this.powerBox.actor) {
           return this._navegatePowerBox(symbol, actor); 
        } else if((this.accessibleBox)&&(actor == this.accessibleBox.actor)) {
           return this._navegateAccessibleBox(symbol, actor); 
        } else if((this.gnoMenuBox)&&(actor == this.gnoMenuBox.actor)) {
           return this._navegateGnoMenuBox(symbol, actor); 
        } else if((this.bttChanger)&&(actor == this.bttChanger.actor)) {
           return this._navegateBttChanger(symbol);
        } else if(actor == this.hover.actor) {
           return this._navegateHoverIcon(symbol, actor);
        } else if(actor == this.hover.menu.actor) {
           return this._navegateHoverMenu(symbol, actor);
        } else if(this._activeContainer === null) {
           item_actor = this._navegationInit(symbol);
        } else if(this._activeContainer == this.applicationsBox) {
           item_actor = this._navegateAppBox(symbol, this._selectedItemIndex, this._selectedRowIndex);
        } else if(this._activeContainer == this.categoriesBox) {
           item_actor = this._navegateCatBox(symbol, this._selectedRowIndex);
        } else if (this.searchFilesystem && (this._fileFolderAccessActive || symbol == Clutter.slash)) {
           return this._searchFileSystem(symbol);
        } else {
           return false;
        }
        if(item_actor == this.searchEntry) {
           return true;
        }
        else if(!item_actor) {
           return false;
        }
        //Main.notify("Item:" + item_actor._delegate);
        if(item_actor._delegate) {
           item_actor._delegate.emit('enter-event');
        }
        return true;
      }
      catch(e) {
        Main.notify("ErrorKey", e.message);
      }
      return false;
   },

   _changeFocusElement: function(elementActive) {
      let tbttChanger = null;
      let staticB = null;
      let favElem = null;
      let gnoMenu = null;
      if(this.bttChanger) tbttChanger = this.bttChanger.actor;
      if(this.accessibleBox) staticB = this.accessibleBox.actor;
      if(this.favoritesObj.getFirstElement()) favElem = this.favoritesScrollBox.actor;
      if(this.gnoMenuBox) gnoMenu = this.gnoMenuBox.actor;
      let activeElements = [this.hover.actor, staticB, gnoMenu, this.powerBox.actor, tbttChanger, this.searchEntry, favElem];
      let actors = [this.hover.actor, staticB, gnoMenu, this.powerBox.actor, tbttChanger, this.searchEntry, this.favoritesObj.getFirstElement()];
      let index = actors.indexOf(elementActive);
      let selected = index + 1;
      while((selected < activeElements.length)&&((!activeElements[selected])||(!activeElements[selected].visible))) {
         selected++;
      }
      if(selected < activeElements.length) {
         return actors[selected];
      }
      let selected = 0;
      while((selected < index)&&((!activeElements[selected])||(!activeElements[selected].visible))) {
         selected++;
      }
      this.hover.refreshFace();
      this.selectedAppBox.setSelectedText("", "");
      return actors[selected];
   },

   _searchFileSystem: function(symbol) {
      if(symbol == Clutter.Return || symbol == Clutter.KP_Enter) {
         if(this._run(this.searchEntry.get_text())) {
            this.menu.close();
         }
         return true;
      }
      else if(symbol == Clutter.slash) {
         // Need preload data before get completion. GFilenameCompleter load content of parent directory.
         // Parent directory for /usr/include/ is /usr/. So need to add fake name('a').
         let text = this.searchEntry.get_text().concat('/a');
         let prefix;
         if(text.lastIndexOf(' ') == -1)
            prefix = text;
         else
            prefix = text.substr(text.lastIndexOf(' ') + 1);
         this._getCompletion(prefix);

         return false;
      }
      else if(symbol == Clutter.Tab) {
         let text = actor.get_text();
         let prefix;
         if(text.lastIndexOf(' ') == -1)
            prefix = text;
         else
            prefix = text.substr(text.lastIndexOf(' ') + 1);
         let postfix = this._getCompletion(prefix);
         if(postfix != null && postfix.length > 0) {
            actor.insert_text(postfix, -1);
            actor.set_cursor_position(text.length + postfix.length);
            if(postfix[postfix.length - 1] == '/')
               this._getCompletion(text + postfix + 'a');
         }
         return true;
      }
      else if(symbol == Clutter.Escape) {
         this.searchEntry.set_text('');
         this._fileFolderAccessActive = false;
      }
      return false;
   },

   _navegationInit: function(symbol) {
      let item_actor;
      this._previousTreeSelectedActor = this.catBoxIter.getFirstVisible();
      if(symbol == Clutter.Tab) {
         this.fav_actor = this._changeFocusElement(this.searchEntry);
         Mainloop.idle_add(Lang.bind(this, this._putFocus));
         item_actor = this.searchEntry;
      } else if((symbol == Clutter.KEY_Right)||(symbol == Clutter.KEY_Up)||(symbol == Clutter.KEY_Down)) {
         if(!this.operativePanel.visible) {
            this.fav_actor = this._changeFocusElement(this.searchEntry);
            Mainloop.idle_add(Lang.bind(this, this._putFocus));
            item_actor = this.searchEntry;
            return item_actor;
         }
         this._activeContainer = this.applicationsBox;
         this._previousSelectedActor = this.applicationsBox.get_child_at_index(0).get_child_at_index(0);
         this._previousTreeSelectedActor._delegate.emit('enter-event');
         item_actor = this.appBoxIter.getFirstVisible();
         this._selectedItemIndex = this.appBoxIter.getAbsoluteIndexOfChild(item_actor);
         this._selectedRowIndex = this.appBoxIter.getInternalIndexOfChild(item_actor);
      }
      //global.stage.set_key_focus(this.powerBox.actor);
      return item_actor;
   },

   _navegateAppBox: function(symbol, index, rowIndex) {
      let item_actor;
      if(!this.operativePanel.visible) {
         this.fav_actor = this._changeFocusElement(this.searchEntry);
         Mainloop.idle_add(Lang.bind(this, this._putFocus));
         item_actor = this.searchEntry;
         return item_actor;
      }
      if(symbol == Clutter.Tab) {
         this.fav_actor = this._changeFocusElement(this.searchEntry);
         Mainloop.idle_add(Lang.bind(this, this._putFocus));
         item_actor = this.searchEntry;
      }
      else if(symbol == Clutter.KEY_Up) {
         this._previousSelectedActor = this.applicationsBox.get_child_at_index(index).get_child_at_index(2*rowIndex);
         item_actor = this.appBoxIter.getPrevVisible(this._previousSelectedActor);
         this._previousVisibleIndex = this.appBoxIter.getVisibleIndex(item_actor);
         index = this.appBoxIter.getAbsoluteIndexOfChild(item_actor);
         this.applicationsScrollBox.scrollToActor(item_actor._delegate.actor);
      } 
      else if(symbol == Clutter.KEY_Down) {
         this._previousSelectedActor = this.applicationsBox.get_child_at_index(index).get_child_at_index(2*rowIndex);
         item_actor = this.appBoxIter.getNextVisible(this._previousSelectedActor);
         this._previousVisibleIndex = this.appBoxIter.getVisibleIndex(item_actor);
         index = this.appBoxIter.getAbsoluteIndexOfChild(item_actor);
         this.applicationsScrollBox.scrollToActor(item_actor._delegate.actor);
      }
      else if(symbol == Clutter.KEY_Right) {
         if(this._previousTreeSelectedActor)
            this._previousTreeSelectedActor._delegate.emit('enter-event');
         this._previousSelectedActor = this.applicationsBox.get_child_at_index(index).get_child_at_index(2*rowIndex);
         item_actor = this.appBoxIter.getRightVisible(this._previousSelectedActor);
         this._previousVisibleIndex = this.appBoxIter.getVisibleIndex(item_actor);
         index = this.appBoxIter.getAbsoluteIndexOfChild(item_actor);
         this.applicationsScrollBox.scrollToActor(item_actor._delegate.actor);
      }
      else if(symbol == Clutter.KEY_Left) {//&& !this.searchActive
         if(this._previousTreeSelectedActor)
            this._previousTreeSelectedActor._delegate.emit('enter-event');
         if(index == 0) {
            this._previousSelectedActor = this.applicationsBox.get_child_at_index(index).get_child_at_index(0);
            item_actor = (this._previousTreeSelectedActor) ? this._previousTreeSelectedActor : this.catBoxIter.getFirstVisible();
            index = this.catBoxIter.getAbsoluteIndexOfChild(item_actor);
            this._previousTreeSelectedActor = item_actor;
            this.categoriesScrollBox.scrollToActor(item_actor._delegate.actor);
            this.hover.refreshFace();
            this.selectedAppBox.setSelectedText("", "");
         } else {
            this._previousSelectedActor = this.applicationsBox.get_child_at_index(index).get_child_at_index(2*rowIndex);
            item_actor = this.appBoxIter.getLeftVisible(this._previousSelectedActor);
            this._previousVisibleIndex = this.appBoxIter.getVisibleIndex(item_actor);
            index = this.appBoxIter.getAbsoluteIndexOfChild(item_actor);
            this.applicationsScrollBox.scrollToActor(item_actor._delegate.actor);
         }
      } else if((symbol == Clutter.KEY_Return) || (symbol == Clutter.KP_Enter)) {
         item_actor = this.applicationsBox.get_child_at_index(index).get_child_at_index(2*rowIndex);
         item_actor._delegate.activate();
      }
      this._selectedItemIndex = index;
      return item_actor;
   },

   _navegateCatBox: function(symbol, index) {
      let item_actor;
      if(!this.operativePanel.visible) {
         this.fav_actor = this._changeFocusElement(this.searchEntry);
         Mainloop.idle_add(Lang.bind(this, this._putFocus));
         item_actor = this.searchEntry;
         return item_actor;
      }
      if(symbol == Clutter.Tab) {
         this.fav_actor = this._changeFocusElement(this.searchEntry);
         Mainloop.idle_add(Lang.bind(this, this._putFocus));
         item_actor = this.searchEntry;
      } 
      else if(!this.gnoMenuBox) {
         if(this.categoriesBox.get_vertical()) {
            if(symbol == Clutter.KEY_Up) {
               this._previousTreeSelectedActor = this.categoriesBox.get_child_at_index(0).get_child_at_index(index);
               this._previousTreeSelectedActor._delegate.isHovered = false;
               item_actor = this.catBoxIter.getPrevVisible(this._activeActor)
               index = this.catBoxIter.getAbsoluteIndexOfChild(item_actor);
               this.categoriesScrollBox.scrollToActor(item_actor._delegate.actor);
            }
            else if(symbol == Clutter.KEY_Down) {
               this._previousTreeSelectedActor = this.categoriesBox.get_child_at_index(0).get_child_at_index(index);
               this._previousTreeSelectedActor._delegate.isHovered = false;
               item_actor = this.catBoxIter.getNextVisible(this._activeActor)
               index = this.catBoxIter.getAbsoluteIndexOfChild(item_actor);
               this._previousTreeSelectedActor._delegate.emit('leave-event');
               this.categoriesScrollBox.scrollToActor(item_actor._delegate.actor);
            }
            else if(symbol == Clutter.KEY_Right) {// && (this._activeContainer !== this.applicationsBox)
               if(this._previousVisibleIndex !== null) {
                  item_actor = this.appBoxIter.getVisibleItem(this._previousVisibleIndex);
               } else {
                  item_actor = this.appBoxIter.getFirstVisible();
               }
               index = this.appBoxIter.getAbsoluteIndexOfChild(item_actor);
            }
         } else {
            if(symbol == Clutter.KEY_Right) {
               this._previousTreeSelectedActor = this.categoriesBox.get_child_at_index(0).get_child_at_index(index);
               this._previousTreeSelectedActor._delegate.isHovered = false;
               item_actor = this.catBoxIter.getNextVisible(this._activeActor)
               index = this.catBoxIter.getAbsoluteIndexOfChild(item_actor);
               this._previousTreeSelectedActor._delegate.emit('leave-event');
               this.categoriesScrollBox.scrollToActor(item_actor._delegate.actor);
            }
            else if(symbol == Clutter.KEY_Left) {
               this._previousTreeSelectedActor = this.categoriesBox.get_child_at_index(0).get_child_at_index(index);
               this._previousTreeSelectedActor._delegate.isHovered = false;
               item_actor = this.catBoxIter.getPrevVisible(this._activeActor)
               index = this.catBoxIter.getAbsoluteIndexOfChild(item_actor);
               this.categoriesScrollBox.scrollToActor(item_actor._delegate.actor);
            }
            else if(symbol == Clutter.KEY_Down) {// && (this._activeContainer !== this.applicationsBox)
               if(this._previousVisibleIndex !== null) {
                  item_actor = this.appBoxIter.getVisibleItem(this._previousVisibleIndex);
               } else {
                  item_actor = this.appBoxIter.getFirstVisible();
               }
               index = this.appBoxIter.getAbsoluteIndexOfChild(item_actor);
            }
         }
         this._selectedItemIndex = index;
         return item_actor;
      }
   },

   _navegateFavBox: function(symbol, actor) {
      this.fav_actor = actor;
      if(symbol == Clutter.Tab) {
         this.fav_actor = this._changeFocusElement(this.favoritesScrollBox.actor);
         Mainloop.idle_add(Lang.bind(this, this._putFocus));
         return true;
      } else {
         if((this.gnoMenuBox)&&(this._gnoMenuNavegationInvertedKey() == symbol)&&
            (this.favoritesObj.isInBorder(symbol, this.fav_actor))) {
            this.fav_actor = this.gnoMenuBox.actor;
            Mainloop.idle_add(Lang.bind(this, this._putFocus));
            return true;
         }
         this.fav_actor = this.favoritesObj.navegateFavBox(symbol, actor);
         if(this.fav_actor) {
            
            let fav_obj = this._searchFavActor(this.fav_actor);
            if(fav_obj) {
               if((symbol == Clutter.KEY_Return) || (symbol == Clutter.KP_Enter)) {
                  fav_obj.activate();
                  return true;
               }
               this.hover.refreshApp(fav_obj.app);
               if(fav_obj.app.get_description())
                  this.selectedAppBox.setSelectedText(fav_obj.app.get_name(), fav_obj.app.get_description().split("\n")[0]);
               else
                  this.selectedAppBox.setSelectedText(fav_obj.app.get_name(), "");
            }
            this.favoritesScrollBox.scrollToActor(this.fav_actor._delegate.actor);
         }
         return true;
      }
   },

   _navegatePowerBox: function(symbol, actor) {
      if(symbol == Clutter.Tab) {
         this.powerBox.disableSelected();
         this.fav_actor = this._changeFocusElement(this.powerBox.actor);
         //global.stage.set_key_focus(this.fav_actor);
         Mainloop.idle_add(Lang.bind(this, this._putFocus));
      }
      else {
         this.powerBox.navegatePowerBox(symbol, actor);
      }
      return true;
   },

   _navegateAccessibleBox: function(symbol, actor) {
      if(symbol == Clutter.Tab) {
         this.accessibleBox.disableSelected();
         this.fav_actor = this._changeFocusElement(this.accessibleBox.actor);
         //global.stage.set_key_focus(this.fav_actor);
         Mainloop.idle_add(Lang.bind(this, this._putFocus));
      }
      else {
         return this.accessibleBox.navegateAccessibleBox(symbol, actor);
      }
      return true;
   },

   _navegateGnoMenuBox: function(symbol, actor) {
      let gnoKey = this._gnoMenuNavegationKey();
      if(symbol == Clutter.Tab) {
         this.gnoMenuBox.disableSelected();
         this.fav_actor = this._changeFocusElement(this.gnoMenuBox.actor);
         //global.stage.set_key_focus(this.fav_actor);
         Mainloop.idle_add(Lang.bind(this, this._putFocus));
      }
      else if((this._activeContainer == this.applicationsBox)||(symbol == gnoKey)) {
         let item_actor;
         if(this._activeContainer == null) {
           item_actor = this._navegationInit(symbol);
         } else if(this._activeContainer == this.categoriesBox) {
            if(symbol == gnoKey) {
               if(this._previousVisibleIndex !== null) {
                  item_actor = this.appBoxIter.getVisibleItem(this._previousVisibleIndex);
               } else {
                  item_actor = this.appBoxIter.getFirstVisible();
               }
               index = this.appBoxIter.getAbsoluteIndexOfChild(item_actor);
            }
            this._selectedItemIndex = index;
         } else if(this._activeContainer == this.applicationsBox) {
            item_actor = this._navegateAppBox(symbol, this._selectedItemIndex, this._selectedRowIndex);
         }
         let copyPreviousTreeSelectedActor = this._previousTreeSelectedActor;
         if((item_actor)&&(item_actor._delegate))
            item_actor._delegate.emit('enter-event');
         this._previousTreeSelectedActor = copyPreviousTreeSelectedActor;
         if(this._activeContainer != this.applicationsBox)
            this._activeContainer = null;
      } else {
         this.gnoMenuBox.navegateGnoMenuBox(symbol, actor);
         //this._activeContainer = null;
      }
      return true;
   },

   _gnoMenuNavegationKey: function() {
      switch(this.styleGnoMenuPanel.style_class) {
            case 'menu-gno-operative-box-left':
                   return Clutter.KEY_Right;
            case 'menu-gno-operative-box-right':
                   return Clutter.KEY_Left;
            case 'menu-gno-operative-box-top':
                   return Clutter.KEY_Down;
            case 'menu-gno-operative-box-bottom':
                   return Clutter.KEY_Up;
      }
      return Clutter.KEY_Up;
/*      if(this.gnoMenuBox.actor.get_vertical()) {
          if(this.gnoMenuBox.actor.get_parent().get_children().indexOf(this.gnoMenuBox.actor) == 0)
             return Clutter.KEY_Left;
          else
             return Clutter.KEY_Right;
      } else {
          if(this.gnoMenuBox.actor.get_parent().get_children().indexOf(this.gnoMenuBox.actor) == 0)
             return Clutter.KEY_Down;
          else
             return Clutter.KEY_Up;
      }*/
   },

   _gnoMenuNavegationInvertedKey: function() {
      if(this.gnoMenuBox.actor.get_vertical()) {
          if(this.gnoMenuBox.actor.get_parent().get_children().indexOf(this.gnoMenuBox.actor) == 0)
             return Clutter.KEY_Left;
          else
             return Clutter.KEY_Right;
      } else {
          if(this.gnoMenuBox.actor.get_parent().get_children().indexOf(this.gnoMenuBox.actor) == 0)
             return Clutter.KEY_Up;
          else
             return Clutter.KEY_Down;
      }
   },

   _navegateBttChanger: function(symbol) {
      if(symbol == Clutter.Tab) {
         this.fav_actor = this._changeFocusElement(this.bttChanger.actor);
         Mainloop.idle_add(Lang.bind(this, this._putFocus));
      } else if((symbol == Clutter.Return) || (symbol == Clutter.KEY_Return) || (symbol == Clutter.KP_Enter)) {
         this.bttChanger.activateNext();
      }
      return true;
   },

   _navegateHoverIcon: function(symbol, actor) {
      if(symbol == Clutter.Tab) {
         this.fav_actor = this._changeFocusElement(this.hover.actor);
         Mainloop.idle_add(Lang.bind(this, this._putFocus));
      }
      return true;
   },

   _navegateHoverMenu: function(symbol, actor) {
      if(symbol == Clutter.Tab) {
         this.fav_actor = this._changeFocusElement(this.hover.actor);
         Mainloop.idle_add(Lang.bind(this, this._putFocus));
      } else {
         this.hover.navegateHoverMenu(symbol, actor);
      }
      return true;
   },

   _putFocus: function() {
      global.stage.set_key_focus(this.fav_actor);
   },

   _searchFavActor: function(actor) {
      for(let key in this._favoritesButtons) {
         if(this._favoritesButtons[key].actor == actor)
           return this._favoritesButtons[key];
      }
      return null;
   },

   _getAppVisibleButtons: function() {
      let visibleAppButtons = new Array();
      for(let i = 0; i < this._applicationsButtons.length; i++) {
         if(this._applicationsButtons[i].actor.visible) {
            visibleAppButtons.push(this._applicationsButtons[i]);
         }
      }
      for(let i = 0; i < this._placesButtons.length; i++) {
         if(this._placesButtons[i].actor.visible) {
            visibleAppButtons.push(this._placesButtons[i]);
         }
      }
      for(let i = 0; i < this._recentButtons.length; i++) {
         if(this._recentButtons[i].actor.visible) {
            visibleAppButtons.push(this._recentButtons[i]);
         }
      }
      for(let i = 0; i < this._transientButtons.length; i++) {
         if(this._transientButtons[i].actor.visible) {
            visibleAppButtons.push(this._transientButtons[i]);
         }
      }
      return visibleAppButtons;
   },

   _updateAppPrefNumIcons: function() {
      this.aviableWidth = this.applicationsScrollBox.actor.get_allocation_box().x2-this.applicationsScrollBox.actor.get_allocation_box().x1 - 42;
      if((this.aviableWidth > 0)&&(this._applicationsBoxWidth > 0)) {// + 42
         this.iconViewCount = Math.floor(this.aviableWidth/this._applicationsBoxWidth);
         if(this.iconViewCount*this._applicationsBoxWidth > this.aviableWidth)
            this.iconViewCount--;
         if(this.iconViewCount < 1)
            this.iconViewCount = 1; 
      }
      this.appBoxIter.setNumberView(this.iconViewCount);

      let viewBox;
      for(let i = 0; i < this.iconViewCount; i++) {
         viewBox = new St.BoxLayout({ vertical: true, width: (this._applicationsBoxWidth) });
         this.applicationsBox.add(viewBox, { x_fill: false, y_fill: false, x_align: St.Align.START, y_align: St.Align.START, expand: true });
      }
   },

   _updateAppSize: function() {
      this._applicationsBoxWidth = 0;   
      for(let i = 0; i < this._applicationsButtons.length; i++) {
         if(this._applicationsButtons[i].actor.get_width() > this._applicationsBoxWidth)
            this._applicationsBoxWidth = this._applicationsButtons[i].actor.get_width();
      }
      for(let i = 0; i < this._applicationsButtons.length; i++) {
         this._applicationsButtons[i].container.set_width(this._applicationsBoxWidth);
      }
      for(let i = 0; i < this._placesButtons.length; i++) {
         this._placesButtons[i].container.set_width(this._applicationsBoxWidth);
      }
      for(let i = 0; i < this._recentButtons.length; i++) {
         this._recentButtons[i].container.set_width(this._applicationsBoxWidth);
      }
      if(this.theme == "windows7") {
         this.searchEntry.set_width(this._applicationsBoxWidth + 20);
      }
   },

   _clearAppSize: function() {
      this._applicationsBoxWidth = 0;
      for(let i = 0; i < this._applicationsButtons.length; i++) {
          this._applicationsButtons[i].container.set_width(-1);
      } 
      for(let i = 0; i < this._placesButtons.length; i++) {
         this._placesButtons[i].container.set_width(-1);
      }
      for(let i = 0; i < this._recentButtons.length; i++) {
         this._recentButtons[i].container.set_width(-1);
      }
   },

   _updateAppButtonDesc: function() {  
      for(let i = 0; i < this._applicationsButtons.length; i++) {
         this._applicationsButtons[i].setAppDescriptionVisible(this.appButtonDescription);
      }
      for(let i = 0; i < this._placesButtons.length; i++) {
         this._placesButtons[i].setAppDescriptionVisible(this.appButtonDescription);
      }
      for(let i = 0; i < this._recentButtons.length; i++) {
         this._recentButtons[i].setAppDescriptionVisible(this.appButtonDescription);
      }
   },

   _updateTextButtonWidth: function() {  
      for(let i = 0; i < this._applicationsButtons.length; i++) {
         this._applicationsButtons[i].setTextMaxWidth(this.textButtonWidth);
      }
      for(let i = 0; i < this._placesButtons.length; i++) {
         this._placesButtons[i].setTextMaxWidth(this.textButtonWidth);
      }
      for(let i = 0; i < this._recentButtons.length; i++) {
         this._recentButtons[i].setTextMaxWidth(this.textButtonWidth);
      }
      //transientButtons are update automatically...
   },

   _setAppIconDirection: function() {
      for(let i = 0; i < this._applicationsButtons.length; i++) {
         this._applicationsButtons[i].setVertical(this.iconView);
      }
      for(let i = 0; i < this._placesButtons.length; i++) {
         this._placesButtons[i].setVertical(this.iconView);
      }
      for(let i = 0; i < this._recentButtons.length; i++) {
         this._recentButtons[i].setVertical(this.iconView);
      }
      //transientButtons are update automatically...
   },

   _updateView: function() {
      this._clearView();
      let visibleAppButtons = this._getAppVisibleButtons();
      this._updateAppPrefNumIcons();
      try {
         let currValue, falseActor;
         let viewBox = this.applicationsBox.get_children();
         for(let i = 0; i < visibleAppButtons.length; i += this.iconViewCount) {
            for(let j = 0; j < this.iconViewCount; j++) {
               currValue = i + j;
               if((currValue < visibleAppButtons.length)&&(viewBox[j])) {
                  viewBox[j].add_actor(visibleAppButtons[currValue].actor);   
                  if(visibleAppButtons[currValue].menu)
                     viewBox[j].add_actor(visibleAppButtons[currValue].menu.actor);
                  else {//Remplace menu actor by a hide false actor.
                     falseActor = new St.BoxLayout();
                     falseActor.hide();
                     viewBox[j].add_actor(falseActor);
                  }
               }
            }
         }
      } catch(e) {
       // Main.notify("Error10", e.message);
      }
   },

   _clearView: function() {
      let appBox = this.applicationsBox.get_children();
      let appItem;
      for(let i = 0; i < appBox.length; i++) {
         appItem = appBox[i].get_children();
         if(appItem) {
            for(let j = 0; j < appItem.length; j++)
               appBox[i].remove_actor(appItem[j]);
            appBox[i].destroy();
            this.applicationsBox.remove_actor(appBox[i]);
         }
      }
   },

   _update_autoscroll: function() {
      this.applicationsScrollBox.setAutoScrolling(this.autoscroll_enabled);
      this.categoriesScrollBox.setAutoScrolling(this.autoscroll_enabled);
      this.favoritesScrollBox.setAutoScrolling(this.autoscroll_enabled);
      if(this.accessibleBox)
         this.accessibleBox.setAutoScrolling(this.autoscroll_enabled);
      if(this.gnoMenuBox)
         this.gnoMenuBox.setAutoScrolling(this.autoscroll_enabled);
   },

   _setIconMaxFavSize: function() {
      this._refreshFavs();
      this._updateSize();
   },

   _setIconControlSize: function() {
      if(this.controlView) {
         this.controlView.setIconSize(this.iconControlSize);
         this._updateSize();
      }
   },

   _setVisibleHoverIconBox: function() {
      if(this.hover) {
         this.hover.setSpecialColor(this.showHoverIconBox);
         this._updateSize();
      }
   },

   _setVisibleControlBox: function() {
      if(this.controlView) {
         this.controlView.setSpecialColor(this.showControlBox);
         this._updateSize();
      }
   },

   _setVisiblePowerBox: function() {
      if(this.powerBox) {
         this.powerBox.setSpecialColor(this.showPowerBox);
         this._updateSize();
      }
   },

   _setVisibleAccessibleBox: function() {
      if(this.accessibleBox) {
         this.accessibleBox.setSpecialColor(this.showAccessibleBox);
         this._updateSize();
      }
   },

   _setVisibleGnoMenuBox: function() {
      if(this.gnoMenuBox) {
         this.gnoMenuBox.setSpecialColor(this.showGnoMenuBox);
         this._updateSize();
      }
   },

   _setVisibleRemovable: function() {
      if(this.accessibleBox) {
         this.accessibleBox.showRemovableDrives(this.showRemovable);
         this._updateSize();
      }
   },

   _setVisibleAccessibleIcons: function() {
      if(this.accessibleBox) {
         this.accessibleBox.setIconsVisible(this.showAccessibleIcons);
         this._updateSize();
      }
   },

   _setVisibleCategoriesIcons: function() {
      this._setCategoriesIconsVisible(this.showCategoriesIcons);
      this._updateSize();
   },

   _setIconPowerSize: function() {
      if(this.powerBox) {
         this.powerBox.setIconSize(this.iconPowerSize);
         this._updateSize();
      }
   },

   _setIconHoverSize: function() {
      if(this.hover) {
         this.hover.setIconSize(this.iconHoverSize);
         this._updateSize();
      }
   },

   _setIconAccessibleSize: function() {
      if(this.accessibleBox) {
         this.accessibleBox.setIconSize(this.iconAccessibleSize);   
      }
      this._updateSize();
   },

   _setIconGnoMenuSize: function() {
      if(this.gnoMenuBox) {
         this.gnoMenuBox.setIconSize(this.iconGnoMenuSize);
      }
      this._updateSize();
   },

   _setVisibleViewControl: function() {
      if(this.controlView) {
         this.controlView.actor.visible = this.showView;
         if(this.accessibleBox)
            this.accessibleBox.updateVisibility();
         this._updateSize();
      }
   },

   _setControlButtonsSymbolic: function() {
      if(this.controlView) {
         this.controlView.setIconSymbolic(this.controlSymbolic);
      }
   },

   _onSwapPanel: function() {
      try {
         if((this.bottomBoxSwaper)&&(this.topBoxSwaper)) {
            let parent = this.topBoxSwaper.get_parent();
            if(parent) parent.remove_actor(this.topBoxSwaper);
            parent = this.bottomBoxSwaper.get_parent();
            if(parent) parent.remove_actor(this.bottomBoxSwaper);

            if(this.swapPanels) {
               this.beginBox.add_actor(this.bottomBoxSwaper);
               this.endBox.add_actor(this.topBoxSwaper);
            }
            else {
               this.beginBox.add_actor(this.topBoxSwaper);
               this.endBox.add_actor(this.bottomBoxSwaper);
            }
         }
      } catch(e) {
         Main.notify("errorTheme", e.message);
      }
   },

   _changeView: function() {
      try {
         if(this.controlView) {
            this.controlView.changeViewSelected(this.iconView);
         this._clearAppSize();
         this._updateAppButtonDesc();
         this._updateTextButtonWidth();
         this._setAppIconDirection();
         this._updateAppSize();
         this._refreshFavs();
         this._updateSize();
      }
      } catch(e) {
         Main.notify("Erp" + e.message);
      }
   },

   _setVisibleFavorites: function() {
      if(this.gnoMenuBox)
         this.gnoMenuBox.showFavorites(this.showFavorites);
      this.favoritesScrollBox.actor.visible = this.showFavorites;
      this._refreshFavs();
      this._updateSize();
   },

   _setVisiblePowerButtons: function() {
      this.powerBox.actor.visible = this.showPowerButtons;
      this._updateSize();
   },

   _setVisibleHoverIcon: function() {
      this.hover.actor.visible = this.showHoverIcon;
      this.hover.container.visible = this.showHoverIcon;
      if(this.accessibleBox)
         this.accessibleBox.updateVisibility();
      if(this.hover.menu.actor.visible)
         this.hover.menu.actor.visible = this.showHoverIcon;
      this._updateSize();
   },

   _setVisibleTimeDate: function() {
      if(this.selectedAppBox)
         this.selectedAppBox.setDateTimeVisible(this.showTimeDate);
   },

   _setVisibleScrollFav: function() {
      if(this.favoritesScrollBox) {
         this.favoritesScrollBox.setScrollVisible(this.scrollFavoritesVisible);
      }
   },

   _setVisibleScrollCat: function() {
      if(this.categoriesScrollBox) {
         this.categoriesScrollBox.setScrollVisible(this.scrollCategoriesVisible);
      }
   },

   _setVisibleScrollApp: function() {
      if(this.applicationsScrollBox) {
         this.applicationsScrollBox.setScrollVisible(this.scrollApplicationsVisible);
      }
   },

   _setVisibleScrollAccess: function() {
      if(this.accessibleBox) {
         this.accessibleBox.setScrollVisible(this.scrollAccessibleVisible);
      }
   },

   _setVisibleScrollGnoMenu: function() {
      if(this.gnoMenuBox) {
         this.gnoMenuBox.setScrollVisible(this.scrollGnoMenuVisible);
      }
   },

   _setVisibleSpacerLine: function() {
      this.powerBox.setSeparatorLine(this.showSpacerLine);
      if(this.accessibleBox)
         this.accessibleBox.setSeparatorLine(this.showSpacerLine);
      if(this.spacerMiddle)
         this.spacerMiddle.setLineVisible(this.showSpacerLine);
      if(this.spacerTop)
         this.spacerTop.setLineVisible(this.showSpacerLine);
      if(this.spacerBottom)
         this.spacerBottom.setLineVisible(this.showSpacerLine);
      this._updateSize();
   },

   _updateSpacerSize: function() {
      this.powerBox.setSeparatorSpace(this.spacerSize);
      if(this.accessibleBox)
         this.accessibleBox.setSeparatorSpace(this.spacerSize);
      if(this.spacerMiddle)
         this.spacerMiddle.setSpace(this.spacerSize);
      if(this.spacerTop)
         this.spacerTop.setSpace(this.spacerSize);
      if(this.spacerBottom)
         this.spacerBottom.setSpace(this.spacerSize);
      this._updateSize();
   },

   _setVisibleBoxPointer: function() {
      this.menu._boxPointer.setArrow(this.showBoxPointer);
   },

   _setFixMenuCorner: function() {
      this.menu.fixToCorner(this.fixMenuCorner);
   },

   _setCategoriesIconsVisible: function() {
      for(let i = 0; i < this._categoryButtons.length; i++)
         this._categoryButtons[i].setIconVisible(this.showCategoriesIcons);
   },

   _updateAppSelectedText: function() {
      this.selectedAppBox.setTitleVisible(this.showAppTitle);
      this.selectedAppBox.setDescriptionVisible(this.showAppDescription);
      this.selectedAppBox.setTitleSize(this.appTitleSize);
      this.selectedAppBox.setDescriptionSize(this.appDescriptionSize);
      this._updateSize();
   },

   _updateTimeDateFormat: function() {
      this.selectedAppBox.setDateFormat(this.dateFormat);
      this.selectedAppBox.setTimeFormat(this.timeFormat);
   },

   _onThemeChange: function() {
      this.updateTheme = true;
      this._updateComplete();
      this._updateSize();
   },

   _onSelectedThemeChange: function() {
      this._timeOutSettings = Mainloop.timeout_add(400, Lang.bind(this, this._updateSelectedTheme));
   },

   _updateSelectedTheme: function() {
      if(this._timeOutSettings > 0) {
         Mainloop.source_remove(this._timeOutSettings);
         this._timeOutSettings = 0;
         try {
            this._loadConfigTheme();
            this._onThemeChange();
         } catch(e) {
            Main.notify("errorTheme", e.message);
         }
      }
   },

   _loadConfigTheme: function() {
      let confTheme = this.getThemeConfig(this.themes[this.theme]);
      this.powerTheme = confTheme["power-theme"];
      this.gnoMenuButtonsTheme = confTheme["gnomenu-buttons-theme"];
      this.showRecent = confTheme["show-recent"];
      this.showPlaces = confTheme["show-places"];
      this.activateOnHover = confTheme["activate-on-hover"];
      this.menuIcon = confTheme["menu-icon"];
      this.menuLabel = confTheme["menu-label"];
      this.searchFilesystem = confTheme["search-filesystem"];
      this.swapPanels = confTheme["swap-panels"];
      this.hover_delay_ms = confTheme["hover-delay"];
      this.autoscroll_enabled = confTheme["enable-autoscroll"];
      this.showView = confTheme["show-view-item"];
      this.controlSymbolic = confTheme["control-symbolic"];
      this.iconView = confTheme["view-item"];
      this.activateOnPress = confTheme["activate-on-press"];
      this.showHoverIconBox = confTheme["hover-box"];
      this.showControlBox = confTheme["control-box"];
      this.showPowerBox = confTheme["power-box"];
      this.showAccessibleBox = confTheme["accessible-box"];
      this.showGnoMenuBox = confTheme["gnomenu-box"];
      this.showRemovable = confTheme["show-removable-drives"];
      this.showAccessibleIcons = confTheme["accessible-icons"];
      this.showCategoriesIcons = confTheme["categories-icons"];
      this.textButtonWidth = confTheme["app-button-width"];
      this.appButtonDescription = confTheme["app-description"];
      this.iconAppSize = confTheme["icon-app-size"];
      this.iconCatSize = confTheme["icon-cat-size"];
      this.iconMaxFavSize = confTheme["icon-max-fav-size"];
      this.iconPowerSize = confTheme["icon-power-size"];
      this.iconControlSize = confTheme["icon-control-size"];
      this.iconHoverSize = confTheme["icon-hover-size"];
      this.iconAccessibleSize = confTheme["icon-accessible-size"];
      this.iconGnoMenuSize = confTheme["icon-gnomenu-size"];
      this.showFavorites = confTheme["show-favorites"];
      this.favoritesLinesNumber = confTheme["favorites-lines"];
      this.showHoverIcon = confTheme["show-hover-icon"];
      this.showPowerButtons = confTheme["show-power-buttons"];
      this.showTimeDate = confTheme["show-time-date"];
      this.timeFormat = confTheme["time-format"];
      this.dateFormat = confTheme["date-format"];
      this.showAppTitle = confTheme["show-app-title"];
      this.appTitleSize = confTheme["app-title-size"];
      this.showAppDescription = confTheme["show-app-description"];
      this.appDescriptionSize = confTheme["app-description-size"];
      this.automaticSize = confTheme["automatic-size"];
      this.fullScreen = confTheme["full-screen"];
      this.width = confTheme["width"];
      this.height = confTheme["height"];
      this.scrollFavoritesVisible = confTheme["scroll-favorites"];
      this.scrollCategoriesVisible = confTheme["scroll-categories"];
      this.scrollApplicationsVisible = confTheme["scroll-applications"];
      this.scrollAccessibleVisible = confTheme["scroll-accessible"];
      this.scrollGnoMenuVisible = confTheme["scroll-gnomenu"];
      this.showSpacerLine = confTheme["spacer-line"];
      this.spacerSize = confTheme["spacer-size"];
      this.showBoxPointer = confTheme["show-box-pointer"];
      this.fixMenuCorner = confTheme["fix-menu-corner"];
   },

   _saveConfigTheme: function() {
      let confTheme = new Array();
      confTheme["power-theme"] = this.powerTheme;
      confTheme["gnomenu-buttons-theme"] = this.gnoMenuButtonsTheme;

      confTheme["show-recent"] = this.showRecent;
      confTheme["show-places"] = this.showPlaces;
      confTheme["activate-on-hover"] = this.activateOnHover;
      confTheme["menu-icon"] = this.menuIcon;
      confTheme["menu-label"] = this.menuLabel;
      confTheme["search-filesystem"] = this.searchFilesystem;
      confTheme["swap-panels"] = this.swapPanels;
      confTheme["hover-delay"] = this.hover_delay_ms;
      confTheme["enable-autoscroll"] = this.autoscroll_enabled;

      confTheme["show-view-item"] = this.showView;
      confTheme["control-symbolic"] = this.controlSymbolic;
      confTheme["view-item"] = this.iconView;
      confTheme["activate-on-press"] = this.activateOnPress;
      confTheme["hover-box"] = this.showHoverIconBox;
      confTheme["control-box"] = this.showControlBox;
      confTheme["power-box"] = this.showPowerBox;
      confTheme["accessible-box"] = this.showAccessibleBox;
      confTheme["gnomenu-box"] = this.showGnoMenuBox;
      confTheme["show-removable-drives"] = this.showRemovable;
      confTheme["accessible-icons"] = this.showAccessibleIcons;
      confTheme["categories-icons"] = this.showCategoriesIcons;
      confTheme["app-button-width"] = this.textButtonWidth;
      confTheme["app-description"] = this.appButtonDescription;
      confTheme["icon-app-size"] = this.iconAppSize;
      confTheme["icon-cat-size"] = this.iconCatSize;
      confTheme["icon-max-fav-size"] = this.iconMaxFavSize;
      confTheme["icon-power-size"] = this.iconPowerSize;
      confTheme["icon-control-size"] = this.iconControlSize;
      confTheme["icon-hover-size"] = this.iconHoverSize;
      confTheme["icon-accessible-size"] = this.iconAccessibleSize;
      confTheme["icon-gnomenu-size"] = this.iconGnoMenuSize;
      confTheme["show-favorites"] = this.showFavorites;
      confTheme["favorites-lines"] = this.favoritesLinesNumber;
      confTheme["show-hover-icon"] = this.showHoverIcon;
      confTheme["show-power-buttons"] = this.showPowerButtons;
      confTheme["show-time-date"] = this.showTimeDate;
      confTheme["time-format"] = this.timeFormat;
      confTheme["date-format"] = this.dateFormat;
      confTheme["show-app-title"] = this.showAppTitle;
      confTheme["app-title-size"] = this.appTitleSize;
      confTheme["show-app-description"] = this.showAppDescription;
      confTheme["app-description-size"] = this.appDescriptionSize;
      confTheme["automatic-size"] = this.automaticSize;
      confTheme["full-screen"] = this.fullScreen;
      confTheme["width"] = this.width;
      confTheme["height"] = this.height;
      confTheme["scroll-favorites"] = this.scrollFavoritesVisible;
      confTheme["scroll-categories"] = this.scrollCategoriesVisible;
      confTheme["scroll-applications"] = this.scrollApplicationsVisible;
      confTheme["scroll-accessible"] = this.scrollAccessibleVisible;
      confTheme["scroll-gnomenu"] = this.scrollGnoMenuVisible;
      confTheme["spacer-line"] = this.showSpacerLine;
      confTheme["spacer-size"] = this.spacerSize;
      confTheme["show-box-pointer"] = this.showBoxPointer;
      confTheme["fix-menu-corner"] = this.fixMenuCorner;
      this.setThemeConfig(this.theme, confTheme);
   },

   _onThemePowerChange: function() {
      if(this.powerBox)
         this.powerBox.setTheme(this.powerTheme);
      this._updateSize();
   },

   _onThemeGnoMenuButtonsChange: function() {
      if(this.gnoMenuBox)
         this.gnoMenuBox.setTheme(this.gnoMenuButtonsTheme);
      this._updateSize();
   },

   _updateComplete: function() {
      if(this.accessibleBox) {
         this.accessibleBox.actor.get_parent().remove_actor(this.accessibleBox.actor);
         this.accessibleBox.actor.destroy(); 
         this.accessibleBox = null;
      }
      if(this.gnoMenuBox) {
         this.gnoMenuBox.actor.get_parent().remove_actor(this.gnoMenuBox.actor);
         this.gnoMenuBox.actor.destroy();
         this.gnoMenuBox = null;
      }
      if(this.bttChanger)
         this.bttChanger.actor.destroy();
      this._onSwapPanel();
      this._updateMenuSection();
      this._setVisibleBoxPointer();
      this._setFixMenuCorner();
      this._display();
      this._setVisibleTimeDate();
      this._setVisibleScrollFav();
      this._setVisibleScrollCat();
      this._setVisibleScrollApp();
      this._setVisibleScrollAccess();
      this._setVisibleScrollGnoMenu();
      if(this.spacerMiddle) {
         this.spacerMiddle.setLineVisible(this.showSpacerLine);
         this.spacerMiddle.setSpace(this.spacerSize);
      }
      if(this.spacerTop) {
         this.spacerTop.setLineVisible(this.showSpacerLine);
         this.spacerTop.setSpace(this.spacerSize);
      }
      if(this.spacerBottom) {
         this.spacerBottom.setLineVisible(this.showSpacerLine);
         this.spacerBottom.setSpace(this.spacerSize);
      }
      this.favoritesScrollBox.actor.visible = this.showFavorites;
      this.selectedAppBox.setTitleVisible(this.showAppTitle);
      this.selectedAppBox.setDescriptionVisible(this.showAppDescription);
      this.selectedAppBox.setTitleSize(this.appTitleSize);
      this.selectedAppBox.setDescriptionSize(this.appDescriptionSize);
      this._setCategoriesIconsVisible(this.showCategoriesIcons);
      this._updateTimeDateFormat();
      this._update_autoscroll();
      this._updateActivateOnHover();
      this._updateIconAndLabel();
      this._update_hover_delay();
      if(this.hover) {
         this.hover.actor.visible = this.showHoverIcon;
         this.hover.container.visible = this.showHoverIcon;
         if(this.hover.menu.actor.visible)
            this.hover.menu.actor.visible = this.showHoverIcon;
         this.hover.setIconSize(this.iconHoverSize);
         this.hover.setSpecialColor(this.showHoverIconBox);
      }
      if(this.gnoMenuBox) {
         this.gnoMenuBox.showFavorites(this.showFavorites);
         this.gnoMenuBox.setIconSize(this.iconGnoMenuSize);
         this.gnoMenuBox.setTheme(this.gnoMenuButtonsTheme);
         this.gnoMenuBox.setSpecialColor(this.showGnoMenuBox);
      }
      if(this.controlView) {
         this.controlView.actor.visible = this.showView;
         this.controlView.setIconSize(this.iconControlSize);
         this.controlView.setSpecialColor(this.showControlBox);
         this.controlView.changeViewSelected(this.iconView);
         this.controlView.setIconSymbolic(this.controlSymbolic);
      }
      if(this.powerBox) {
         this.powerBox.setSeparatorLine(this.showSpacerLine);
         this.powerBox.setSeparatorSpace(this.spacerSize);
         this.powerBox.setIconSize(this.iconPowerSize);
         this.powerBox.actor.visible = this.showPowerButtons;
         this.powerBox.setTheme(this.powerTheme);
         this.powerBox.setSpecialColor(this.showPowerBox);
      }
      if(this.accessibleBox) {
         this.accessibleBox.setSeparatorLine(this.showSpacerLine);
         this.accessibleBox.setSeparatorSpace(this.spacerSize);
         this.accessibleBox.setIconSize(this.iconAccessibleSize);
         this.accessibleBox.setSpecialColor(this.showAccessibleBox);
         this.accessibleBox.showRemovableDrives(this.showRemovable);
         this.accessibleBox.setIconsVisible(this.showAccessibleIcons);
         this.accessibleBox.updateVisibility();
      }
      this._clearAppSize();
      this._updateAppButtonDesc();
      this._updateTextButtonWidth();
      this._setAppIconDirection();
      this._updateAppSize();
      this._refreshFavs();
      //this._updateView();
      if(this.fullScreen) {
         if(this.controlView) {
            this.controlView.changeResizeActive(false);
            this.controlView.changeFullScreen(this.fullScreen);
         }
         this.menu._boxPointer.setArrow(false);
         this.menu.fixToCorner(true);
      }
   },

   _setAutomaticSize: function() {
      if(this.controlView)
         this.controlView.changeResizeActive(false);      
      this._updateSize();
   },

   _setFullScreen: function() {
      if(this.controlView)
         this.controlView.changeFullScreen(this.fullScreen);
      if(this.fullScreen) {
         if(this.controlView)
            this.controlView.changeResizeActive(false);
         this.menu._boxPointer.setArrow(false);
         this.menu.fixToCorner(true);
      } else {
         this.menu._boxPointer.setArrow(this.showBoxPointer);
         this.menu.fixToCorner(this.fixMenuCorner);         
      }
      this._updateSize();
   },

   _updateSize: function() {
      if((this.mainBox)&&(this.displayed)) {
         let monitor = Main.layoutManager.findMonitorForActor(this.actor);
         if(this.fullScreen) {
            let panelTop = this._processPanelSize(false);
            let panelButton = this._processPanelSize(true);
            let themeNode = this.menu._boxPointer.actor.get_theme_node();
            let difference = this.menu.actor.get_height() - this.mainBox.get_height();
            if(difference < 0) {
               this.mainBox.set_height(monitor.height - panelButton - panelTop - 40);
               this.mainBox.set_width(monitor.width);
            }
            difference = this.menu.actor.get_height() - this.mainBox.get_height();
            let bordersY = themeNode.get_length('border-bottom') + themeNode.get_length('border-top') +
            themeNode.get_length('padding-top') + themeNode.get_length('padding-bottom') + themeNode.get_length('-arrow-border-width');
            if(panelTop == 0)
               bordersY++;
            this.mainBox.set_width(monitor.width - this.menu.actor.width + this.mainBox.width);
            this.mainBox.set_height(monitor.height - panelButton - panelTop + bordersY - difference);
            this._updateView();
            if((this.theme == "windows7")||(this.theme == "mint")) {
               this.controlBox.visible = false;
               this.controlBox.visible = true;
            }
         } else if(this.automaticSize) {
            this.mainBox.set_width(-1);
            this.mainBox.set_height(-1);
            this._clearView();
            if((this.bttChanger)||(this.gnoMenuBox)) {
               let operPanelVisible = this.operativePanel.visible;
               this.operativePanel.visible = true;
               this.favoritesScrollBox.actor.visible = false;
               this.height = this.mainBox.get_height();
               this.mainBox.set_height(this.height);
               this.operativePanel.visible = operPanelVisible;
               this.favoritesScrollBox.actor.visible = !operPanelVisible;
            } else {
               this.height = this.mainBox.get_height();
               this.mainBox.set_height(this.height);
            }
            this._updateView();
            this.width = this.mainBox.get_width();
            this.mainBox.set_width(this.width);
         } else {
            if(this.width > this.mainBox.get_width()) {
               if(this.width > monitor.width)
                  this.width = monitor.width;
               this.mainBox.set_width(this.width);
            } else {
               if(this.width > this.minimalWidth) {
                  this.mainBox.set_width(this.width);
                  this._clearView();
                  Mainloop.idle_add(Lang.bind(this, function() {//checking correct width and revert if it's needed.
                     let minWidth = this._minimalWidth();
                     if(this.width < minWidth) {
                        this.width = minWidth;
                        this.mainBox.set_width(this.width);
                        this._updateView();
                     }
                    // this.minimalWidth = minWidth;
                  }));
               }
            }
            let maxHeigth = monitor.height - this._processPanelSize(true) - this._processPanelSize(false);
            if(this.height > this.mainBox.get_height()) {
               if(this.height > maxHeigth)
                  this.height = maxHeigth;
               this.mainBox.set_height(this.height);
            } else {
               if(this.height > this.minimalHeight) {
                  this.mainBox.set_height(this.height);
                  this._clearView();
                  Mainloop.idle_add(Lang.bind(this, function() {//checking correct height and revert if it's needed.
                     let minHeight = this._minimalHeight();
                     if(this.height < minHeight) {
                        this.height = minHeight;
                        this.mainBox.set_height(this.height);
                        this._updateView();
                     }
                     this.minimalHeight = minHeight;
                  }));
               } else {
                  this.height = this.minimalHeight;
                  this.mainBox.set_height(this.height);
               }
            }
            this._updateView();
         }
      }
   },

   allocationWidth: function(actor) {
      return actor.get_allocation_box().x2-actor.get_allocation_box().x1;
   },

   allocationHeight: function(actor) {
      return actor.get_allocation_box().y2-actor.get_allocation_box().y1;
   },

   _minimalHeight: function() {
      let scrollBoxHeight =  this.controlSearchBox.get_height() + this.endHorizontalBox.get_height() + 10;
      if(!this.categoriesBox.get_vertical())
         scrollBoxHeight += this.categoriesBox.get_height();
      if(!this.favBoxWrapper.get_vertical())
         scrollBoxHeight += this.favBoxWrapper.get_height();
      if(this.gnoMenuBox)
         scrollBoxHeight += this.powerBox.actor.get_height() + 40;
      if(scrollBoxHeight + 20 < 280)
         scrollBoxHeight = 280;
      return scrollBoxHeight + 20;
   },

   _minimalWidth: function() {
      let width = this.extendedBox.get_width();
      let interWidth = 0;
      if(!this.categoriesBox.get_vertical()) {
         interWidth = this.controlBox.get_width();
         if(this.hover.actor.visible)
           interWidth += this.hover.actor.get_width() + this.hover.menu.actor.get_width();
         if((!this.favBoxWrapper.get_vertical())&&(this.favBoxWrapper.get_width() > width))
            interWidth = this.favBoxWrapper.get_width();
      }
      if(interWidth > width)
         width = interWidth;
      if((this.accessibleBox)&&(this.accessibleBox.actor.visible))
         width += this.accessibleBox.actor.get_width();
      let themeNode = this.menu._boxPointer.actor.get_theme_node();
      return width;
   },

   _onButtonReleaseEvent: function(actor, event) {
      if((this._draggable)&&(!this._draggable.inhibit))
         return false;
      if(!this.activateOnPress)
         this._menuEventClicked(actor, event);
      return true;
   },

   _onButtonPressEvent: function(actor, event) {
      if((this._draggable)&&(!this._draggable.inhibit))
         return false;
      if(this.activateOnPress)
         this._menuEventClicked(actor, event);
      return true;
   },

   _menuEventClicked: function(actor, event) {
      if(event.get_button() == 1) {
         if(this._applet_context_menu.isOpen) {
            this._applet_context_menu.toggle(); 
         }
         this.on_applet_clicked(event);            
      }
      if(event.get_button() == 3) {            
         if(this._applet_context_menu._getMenuItems().length > 0) {
            this._applet_context_menu.toggle();			
         }
      }
   },

   _updateMenuSection: function() {
      if(this.menu) {
         this.menu.close();
         this.menu.destroy();
         this.menu = new ConfigurableMenu(this, this.orientation);
         this.menu.actor.connect('motion-event', Lang.bind(this, this._onResizeMotionEvent));
         this.menu.actor.connect('button-press-event', Lang.bind(this, this._onBeginResize));
         this.menu.actor.connect('leave-event', Lang.bind(this, this._disableOverResizeIcon));
         this.menu.actor.connect('button-release-event', Lang.bind(this, this._disableResize));
         this.menu.connect('open-state-changed', Lang.bind(this, this._onOpenStateChanged));
         this.menu.actor.add_style_class_name('menu-background');
         this.menuManager.addMenu(this.menu);
      }
   },

   _onResizeMotionEvent: function(actor, event) {
      if(!this.actorResize) {
         let [mx, my] = event.get_coords();
         let [ax, ay] = actor.get_transformed_position();
         let ar = ax + actor.get_width();
         let at = ay + actor.get_height();
         if(this._isInsideMenu(mx, my, ax, ay, ar, at)) {
            if(this._correctPlaceResize(mx, my, ax, ay, ar, at)) {
               this._cursorChanged = true;
               global.set_cursor(Cinnamon.Cursor.DND_MOVE);
            } else if(this._cursorChanged) {
               this._cursorChanged = false;
               global.unset_cursor();
            }
         } else if(this._cursorChanged) {
            this._cursorChanged = false;
            global.unset_cursor();
         }
      }
   },

   _onBeginResize: function(actor, event) {
      this.actorResize = actor;
      let [mx, my] = event.get_coords();
      let [ax, ay] = actor.get_transformed_position();
      let aw = actor.get_width();
      let ah = actor.get_height();
      if(this._isInsideMenu(mx, my, ax, ay, aw, ah)) {
         if(this._correctPlaceResize(mx, my, ax, ay, aw, ah)) {
            this._findMouseDeltha();
            global.set_cursor(Cinnamon.Cursor.DND_MOVE);
            this._doResize();
         }
      }
   },

   _findMouseDeltha: function(mx, my) {
      if(this.actorResize) {
         this.mouseDx = 0;
         this.mouseDy = 0;
            this._updatePosResize();
         this.mouseDx = this.width - this.mainBox.get_width();
         this.mouseDy = this.height - this.mainBox.get_height();
      }
      
   },

   _disableResize: function() {
      this.actorResize = null;
      global.unset_cursor();
   },

   _disableOverResizeIcon: function() {
      if(!this.actorResize) {
         this._disableResize();
      }
   },

   _isInsideMenu: function(mx, my, ax, ay, aw, ah) {
      return ((this.controlingSize)&&(mx > ax)&&(mx < ax + aw)&&(my > ay)&&(my < ay + ah));
   },

   _correctPlaceResize: function(mx, my, ax, ay, aw, ah) {
      let monitor = Main.layoutManager.findMonitorForActor(this.actor);
      let middelScreen = (monitor.x + monitor.width)/2;
      let [cx, cy] = this.actor.get_transformed_position();
      switch (this.orientation) {
         case St.Side.TOP:
            if(my > ah - this.deltaMinResize) {
               if(cx > middelScreen)
                  return (mx < ax + this.deltaMinResize);
               return (mx > aw - this.deltaMinResize);
            }
            return false;
         case St.Side.BOTTOM:
            if(my < ay + this.deltaMinResize) {
               if(cx < middelScreen)
                  return (mx > aw - this.deltaMinResize);
               return  (mx < ax + this.deltaMinResize);
            }
            return false;
      }
      return false;
   },

   _doResize: function() {
      if(this.actorResize) {
         this._updatePosResize();
         this._updateSize();
         Mainloop.timeout_add(300, Lang.bind(this, this._doResize));
      }
   },

   _updatePosResize: function() {
      if(this.actorResize) {
         let [mx, my, mask] = global.get_pointer();
         let [ax, ay] = this.actorResize.get_transformed_position();
         aw = this.actorResize.get_width();
         ah = this.actorResize.get_height();
         let monitor = Main.layoutManager.findMonitorForActor(this.actor);
         let middelScreen = (monitor.x + monitor.width)/2;
         let [cx, cy] = this.actor.get_transformed_position();
         switch (this.orientation) {
            case St.Side.TOP:
               this.height = this.mainBox.get_height() + my - this._processPanelSize(false) - ah + 4 - this.mouseDy;
               if(cx < middelScreen)
                  this.width = mx - ax - this.mouseDx;
               else
                  this.width = this.mainBox.get_width() + ax - mx - this.mouseDx;
               break;
            case St.Side.BOTTOM:
               this.height = this.mainBox.get_height() + ay - my + 4 - this.mouseDy;
               if(cx < middelScreen)
                  this.width = mx - ax - this.mouseDx;
               else
                  this.width = this.mainBox.get_width() + ax - mx - this.mouseDx;
               break;
         }
      }
   },

   _processPanelSize: function(bottomPosition) {
      let panelHeight;
      let panelResizable = global.settings.get_boolean("panel-resizable");
      if(panelResizable) {
         if(bottomPosition) {
            panelHeight = global.settings.get_int("panel-bottom-height");
         }
         else {
            panelHeight = global.settings.get_int("panel-top-height");
         }
      }
      else {
         let themeNode = this.actor.get_theme_node();
         panelHeight = themeNode.get_length("height");
         if(!panelHeight || panelHeight == 0) {
            panelHeight = 25;
         }
      }
      if((!Main.panel2)&&(((this.orientation == St.Side.TOP)&&(bottomPosition))||
         ((this.orientation == St.Side.BOTTOM)&&(!bottomPosition)))) {
         panelHeight = 0;
      }
      return panelHeight;
   },

   _display: function() {
      try {
         this.minimalWidth = -1;
         this.minimalHeight = -1;
         this.displayed = false;
         if(this.selectedAppBox)
            this.selectedAppBox.setDateTimeVisible(false);
         this.allowFavName = false;
         this.bttChanger = null;
         this._activeContainer = null;
         this._activeActor = null;
         this.vectorBox = null;
         this.actor_motion_id = 0;
         this.vector_update_loop = null;
         this.current_motion_actor = null;
         let section = new PopupMenu.PopupMenuSection();
         this.menu.addMenuItem(section);     

         this._session = new GnomeSession.SessionManager();
         this._screenSaverProxy = new ScreenSaver.ScreenSaverProxy();

         this.standardBox = new St.BoxLayout({ vertical:false });

         this.rightPane = new St.BoxLayout({ vertical: true });
         this.beginBox = new St.BoxLayout({ vertical: true });
         this.endBox = new St.BoxLayout({ vertical: true });
         this.rightPane.add_actor(this.beginBox);      
//search
         this.topBoxSwaper = new St.BoxLayout({ style_class: 'menu-top-box', vertical: false });
         this.bottomBoxSwaper = new St.BoxLayout({ style_class: 'menu-bottom-box', vertical: false });
         this.controlSearchBox = new St.BoxLayout({ vertical: false });
         this.controlBox = new St.BoxLayout({ vertical: true });
         this.topBoxSwaper.add(this.controlSearchBox, { x_fill: true, y_fill: true, expand: true });
         if(this.swapPanels) {
            this.beginBox.add_actor(this.bottomBoxSwaper);
            this.endBox.add_actor(this.topBoxSwaper);//, { x_fill: true, y_fill: true, expand: true });
         }
         else {
            this.beginBox.add_actor(this.topBoxSwaper);
            this.endBox.add_actor(this.bottomBoxSwaper);//, { x_fill: true, y_fill: true, expand: true });
         }

         this.searchBox = new St.BoxLayout({ style_class: 'menu-search-box' });
         this.searchBox.set_style("padding-right: 0px; padding-left: 0px");

         this.searchEntry = new St.Entry({ name: 'menu-search-entry',
                                           hint_text: _("Type to search..."),
                                           track_hover: true,
                                           can_focus: true });

         this.searchEntry.set_secondary_icon(this._searchInactiveIcon);

         this.controlSearchBox.add(this.controlBox, {x_fill: true, y_fill: true, x_align: St.Align.START, y_align: St.Align.START, expand: true });
         this.searchActive = false;
         this.searchEntryText = this.searchEntry.clutter_text;
         this.searchEntryText.connect('text-changed', Lang.bind(this, this._onSearchTextChanged));
         this.searchEntryText.connect('key-press-event', Lang.bind(this, this._onMenuKeyPress));
         this._previousSearchPattern = "";

         this.searchName = new St.Label({ style_class: 'menu-selected-app-title', text: _("Filter:"), visible: false });
         this.searchName.style="font-size: " + 10 + "pt";
         this.panelAppsName = new St.Label({ style_class: 'menu-selected-app-title', text: _("Favorites"), visible: false });
         this.panelAppsName.style="font-size: " + 10 + "pt";

         this.searchBox.add(this.searchName, {x_fill: false, x_align: St.Align.START, y_align: St.Align.MIDDLE, y_fill: false, expand: false });
         this.searchBox.add_actor(this.searchEntry);

         this.controlView = new ControlBox(this, this.iconControlSize);

//search
         this.hover = new HoverIcon(this, this.iconHoverSize);
         this.hover.actor.connect('key-press-event', Lang.bind(this, this._onMenuKeyPress));
         this.hover.menu.actor.connect('key-press-event', Lang.bind(this, this._onMenuKeyPress));

         /*this.hoverBox = new St.BoxLayout({ vertical: false });
         this.hoverBox.add_actor(this.hover.actor);
         this.hoverBox.add_actor(this.hover.menu.actor);*/

         this.categoriesApplicationsBox = new CategoriesApplicationsBoxExtended();

         this.categoriesBox = new St.BoxLayout({ style_class: 'menu-categories-box', vertical: true });
         this.categoriesSpaceUp = new St.BoxLayout({ style_class: 'menu-categories-space-' + this.theme });
         this.categoriesSpaceDown = new St.BoxLayout({ style_class: 'menu-categories-space-' + this.theme });
         this.categoriesBox.add_style_class_name('menu-categories-box-' + this.theme);
         this.applicationsBox = new St.BoxLayout({ style_class: 'menu-applications-box', vertical: false });
         this.applicationsBox.add_style_class_name('menu-applications-box-' + this.theme);
         this.favBoxWrapper = new St.BoxLayout({ vertical: true });
         this.favoritesBox = new St.BoxLayout({ style_class: 'menu-favorites-box', vertical: true });
         this.favoritesBox.add_style_class_name('menu-favorites-box-' + this.theme);
         this.applicationsScrollBox = new ScrollItemsBox(this, this.applicationsBox, true);

         this.a11y_settings = new Gio.Settings({ schema: "org.cinnamon.desktop.a11y.applications" });
         this.a11y_settings.connect("changed::screen-magnifier-enabled", Lang.bind(this, this._updateVFade));
         this._updateVFade();

         this.endVerticalBox = new St.BoxLayout({ vertical: true });
         this.endHorizontalBox = new St.BoxLayout({ vertical: false });

         this.selectedAppBox = new SelectedAppBox(this, this.showTimeDate);

         this.betterPanel = new St.BoxLayout({ vertical: false });
         this.operativePanel = new St.BoxLayout({ vertical: false });
         this.operativePanelExpanded = new St.BoxLayout({ vertical: true});
         this.categoriesWrapper = new St.BoxLayout({ vertical: true });
         this.operativePanel.add(this.categoriesWrapper, { x_fill: true, y_fill: true, expand: false });

         this.mainBox = new St.BoxLayout({ vertical: false });
         this.menuBox = new St.BoxLayout({ vertical: false, style_class: 'menu-main-box'});
         this.menuBox.add_actor(this.mainBox);


         this.extendedBox = new St.BoxLayout({ vertical: true });
         this.extendedBox.add(this.standardBox, { x_fill: true, y_fill: true, y_align: St.Align.START, expand: true});
         this.spacerTop = new SeparatorBox(this.showSpacerLine, this.spacerSize);
         this.spacerBottom = new SeparatorBox(this.showSpacerLine, this.spacerSize);
         this.spacerMiddle = new SeparatorBox(this.showSpacerLine, this.spacerSize);

         this.spacerTop.separatorLine.actor.add_style_class_name('menu-separator-top-' + this.theme);
         this.spacerMiddle.separatorLine.actor.add_style_class_name('menu-separator-center-' + this.theme);
         this.spacerBottom.separatorLine.actor.add_style_class_name('menu-separator-bottom-' + this.theme);
         this.spacerTop.actor.connect('allocation_changed', Lang.bind(this, this._allocateSpacer));
         this.spacerMiddle.actor.connect('allocation_changed', Lang.bind(this, this._allocateSpacer));
         this.spacerBottom.actor.connect('allocation_changed', Lang.bind(this, this._allocateSpacer));


         switch(this.theme) {
            case "classic"        :
                          this.loadClassic(); 
                          break;
            case "gnomenuLeft"    :
                          this.loadGnoMenuLeft(); 
                          break;
            case "gnomenuRight"   :
                          this.loadGnoMenuRight(); 
                          break;
            case "gnomenuTop"     :
                          this.loadGnoMenuTop(); 
                          break;
            case "gnomenuBottom"  :
                          this.loadGnoMenuBottom(); 
                          break;
            case "vampire"        :
                          this.loadVampire(); 
                          break;
            case "garibaldo"      :
                          this.loadGaribaldo(); 
                          break;
            case "stylized"       :
                          this.loadStylized(); 
                          break;
            case "dragon"         :
                          this.loadDragon(); 
                          break;
            case "dragonInverted" :
                          this.loadDragonInverted(); 
                          break;
            case "horizontal"     :
                          this.loadHorizontal(); 
                          break;
            case "accessible"     :
                          this.loadAccessible(); 
                          break;
            case "accessibleInverted":
                          this.loadAccessibleInverted(); 
                          break;
            case "mint"              :
                          this.loadMint(); 
                          break;
            case "windows7"           :
                          this.loadWindows(); 
                          break;
            default                  :
                          this.loadClassic(); 
                          break;
         }

         this.operativePanel.add(this.applicationsScrollBox.actor, {x_fill: true, y_fill: true, y_align: St.Align.START, expand: true});
         this.rightPane.add(this.categoriesApplicationsBox.actor, {x_fill: true, y_fill: true, y_align: St.Align.START, expand: true});

         this.favoritesBox.add(this.favoritesObj.actor, { x_fill: true, y_fill: true, x_align: St.Align.END, y_align: St.Align.MIDDLE, expand: false });

         this.categoriesApplicationsBox.actor.add(this.betterPanel, {x_fill: true, y_fill: true, y_align: St.Align.START, expand: true});

         this.appBoxIter = new VisibleChildIteratorExtended(this, this.applicationsBox, this.iconViewCount);
         this.applicationsBox._vis_iter = this.appBoxIter;
         this.catBoxIter = new VisibleChildIteratorExtended(this, this.categoriesBox, 1);
         this.categoriesBox._vis_iter = this.catBoxIter;

         this._refreshApps();

         this.signalKeyPowerID = 0;
         this._update_autoscroll();
         
         section.actor.add_actor(this.menuBox);

         Mainloop.idle_add(Lang.bind(this, function() {
            this._clearAllSelections(true);
            this._clearAppSize();
            this._updateAppSize();
         }));
      } catch(e) {
         Main.notify("ErrorDisplay:", e.message);
      }
   },

   _allocateSpacer: function(actor, box, flags) {
      let objectActor = null;
      switch(actor) {
         case this.spacerTop.actor :
            objectActor = this.spacerTop
            break;
         case this.spacerMiddle.actor :
            objectActor = this.spacerMiddle
            break;
         case this.spacerBottom.actor :
            objectActor = this.spacerBottom 
            break;
      }
      if(objectActor) {
         let sourceNode = objectActor.separatorLine.actor.get_theme_node(); 
         if(sourceNode.get_length('-remove-separator') != 0) {
             objectActor.actor.visible = false;
         }   
      }

      return false;
   },

   loadClassic: function() {
      this.controlSearchBox.add(this.hover.container, {x_fill: false, x_align: St.Align.MIDDLE, y_align: St.Align.START, expand: true });
      this.controlBox.add(this.controlView.actor, {x_fill: true, y_fill: false, x_align: St.Align.START, y_align: St.Align.START, expand: true });
      this.controlBox.add(this.searchBox, { x_fill: false, y_fill: false, x_align: St.Align.START, y_align: St.Align.END, expand: true });
      this.favoritesObj = new FavoritesBoxExtended(this, true, this.favoritesLinesNumber);
      this.categoriesScrollBox = new ScrollItemsBox(this, this.categoriesBox, true);
      this.favoritesScrollBox = new ScrollItemsBox(this, this.favoritesBox, true);
      this.favBoxWrapper.add(this.favoritesScrollBox.actor, { y_fill: false, y_align: St.Align.START, expand: true });
      this.categoriesWrapper.add(this.categoriesScrollBox.actor, {x_fill: true, y_fill: true, y_align: St.Align.START, expand: true});
      this.categoriesWrapper.add(this.categoriesSpaceDown, {x_fill: true, y_fill: true, y_align: St.Align.START, expand: true});
      this.powerBox = new PowerBox(this, "vertical", this.iconPowerSize, this.hover, this.selectedAppBox);
      this.favBoxWrapper.add(this.powerBox.actor, { y_align: St.Align.END, y_fill: false, expand: false });
      this.standardBox.add(this.favBoxWrapper, { y_align: St.Align.END, y_fill: true, expand: false });
      this.standardBox.add(this.rightPane, { span: 2, x_fill: true, expand: true });
      this.rightPane.add_actor(this.spacerTop.actor);
      this.betterPanel.add(this.operativePanel, { x_fill: true, y_fill: true, y_align: St.Align.START, expand: true });
      this.mainBox.add(this.extendedBox, { x_fill: true, y_fill: true, y_align: St.Align.START, expand: true });
      this.extendedBox.add(this.endVerticalBox, { x_fill: true, y_fill: false, y_align: St.Align.END, expand: false });
      this.endHorizontalBox.add(this.selectedAppBox.actor, { x_fill: true, y_fill: false, x_align: St.Align.END, y_align: St.Align.MIDDLE, expand: true });
      this.endVerticalBox.add_actor(this.spacerBottom.actor);
      this.endVerticalBox.add_actor(this.endBox);
      this.bottomBoxSwaper.add(this.endHorizontalBox, { x_fill: true, y_fill: true, expand: true });
      this.controlBox.set_style('padding-left: 20px;');
      this.searchBox.set_style('padding-left: 0px; padding-top: 10px;');
      this.operativePanel.set_style_class_name('menu-operative-box');
   },

   loadVampire: function() { 
      this.controlBox.add(this.controlView.actor, {x_fill: false, y_fill: false, x_align: St.Align.START, y_align: St.Align.MIDDLE, expand: true });
      this.controlSearchBox.add(this.searchBox, {x_fill: false, y_fill: false, x_align: St.Align.END, y_align: St.Align.MIDDLE, expand: true });
      this.favoritesObj = new FavoritesBoxExtended(this, true, this.favoritesLinesNumber);
      this.categoriesScrollBox = new ScrollItemsBox(this, this.categoriesBox, true);
      this.favoritesScrollBox = new ScrollItemsBox(this, this.favoritesBox, true);
      this.favBoxWrapper.add(this.favoritesScrollBox.actor, { y_fill: false, y_align: St.Align.START, expand: true });
      this.categoriesWrapper.add(this.categoriesScrollBox.actor, {x_fill: true, y_fill: true, y_align: St.Align.START, expand: true});
      this.categoriesWrapper.add(this.categoriesSpaceDown, {x_fill: true, y_fill: true, y_align: St.Align.START, expand: true});
      this.powerBox = new PowerBox(this, "horizontal", this.iconPowerSize, this.hover, this.selectedAppBox);
      this.selectedAppBox.setAlign(St.Align.START);
      this.endHorizontalBox.add(this.hover.container, { x_fill: false, x_align: St.Align.END, expand: false });
      this.endHorizontalBox.add(this.selectedAppBox.actor, { x_fill: true, y_fill: false, x_align: St.Align.START, y_align: St.Align.MIDDLE, expand: true });
      this.endHorizontalBox.add(this.powerBox.actor, { x_fill: false, y_fill: false, x_align: St.Align.END, expand: false });
      this.betterPanel.add(this.favBoxWrapper, { y_align: St.Align.MIDDLE, y_fill: true, expand: false });
      this.standardBox.add(this.rightPane, { span: 2, x_fill: true, expand: true });
      this.rightPane.add_actor(this.spacerTop.actor);
      this.betterPanel.add(this.operativePanel, { x_fill: true, y_fill: true, y_align: St.Align.START, expand: true });
      this.mainBox.add(this.extendedBox, { x_fill: true, y_fill: true, y_align: St.Align.START, expand: true });
      this.extendedBox.add(this.endVerticalBox, { x_fill: true, y_fill: false, y_align: St.Align.END, expand: false });
      this.endVerticalBox.add_actor(this.spacerBottom.actor, { x_fill: true, y_fill: true, expand: true });
      this.endVerticalBox.add(this.endBox, { x_fill: true, y_fill: true, expand: true });
      this.bottomBoxSwaper.add(this.endHorizontalBox, { x_fill: true, y_fill: true, expand: true });
      this.operativePanel.set_style_class_name('menu-operative-box');
   },

   loadGaribaldo: function() {
      this.controlSearchBox.add(this.searchBox, {x_fill: false, y_fill: false, x_align: St.Align.START, y_align: St.Align.MIDDLE, expand: true });
      this.controlSearchBox.add(this.controlView.actor, {x_fill: false, x_align: St.Align.END, y_align: St.Align.MIDDLE, expand: true });
      this.favoritesObj = new FavoritesBoxExtended(this, true, this.favoritesLinesNumber);
      this.categoriesScrollBox = new ScrollItemsBox(this, this.categoriesBox, true);
      this.favoritesScrollBox = new ScrollItemsBox(this, this.favoritesBox, true);
      this.favBoxWrapper.add(this.favoritesScrollBox.actor, { y_fill: false, y_align: St.Align.START, expand: true });
      this.categoriesWrapper.add(this.categoriesScrollBox.actor, {x_fill: true, y_fill: true, y_align: St.Align.START, expand: true});
      this.categoriesWrapper.add(this.categoriesSpaceDown, {x_fill: true, y_fill: true, y_align: St.Align.START, expand: true});
      this.powerBox = new PowerBox(this, "horizontal", this.iconPowerSize, this.hover, this.selectedAppBox);
      this.favBoxWrapper.add(this.powerBox.actor, { y_align: St.Align.END, y_fill: false, expand: false });
      this.endHorizontalBox.add(this.selectedAppBox.actor, { x_fill: true, y_fill: false, x_align: St.Align.START, y_align: St.Align.MIDDLE, expand: true });
      this.endHorizontalBox.add(this.hover.container, { x_fill: false, x_align: St.Align.END, expand: false });
      this.betterPanel.add(this.favBoxWrapper, { y_align: St.Align.MIDDLE, y_fill: true, expand: false });
      this.standardBox.add(this.rightPane, { span: 2, x_fill: true, expand: true });
      this.rightPane.add_actor(this.spacerTop.actor);
      this.betterPanel.add(this.operativePanel, { x_fill: true, y_fill: true, y_align: St.Align.START, expand: true });
      this.mainBox.add(this.extendedBox, { x_fill: true, y_fill: true, y_align: St.Align.START, expand: true });
      this.extendedBox.add(this.endVerticalBox, { x_fill: true, y_fill: false, y_align: St.Align.END, expand: false });
      this.endVerticalBox.add_actor(this.spacerBottom.actor);
      this.endVerticalBox.add(this.endBox, { x_fill: true, y_fill: true, expand: true });
      this.bottomBoxSwaper.add(this.endHorizontalBox, { x_fill: true, y_fill: true, expand: true });
      this.operativePanel.set_style_class_name('menu-operative-box');
   },

   loadStylized: function() {
      this.controlSearchBox.add(this.hover.container, {x_fill: false, x_align: St.Align.MIDDLE, y_align: St.Align.START, expand: true });
      this.controlBox.add(this.controlView.actor, {x_fill: true, y_fill: false, x_align: St.Align.START, y_align: St.Align.START, expand: true });
      this.controlBox.add(this.searchBox, { x_fill: false, y_fill: false, x_align: St.Align.START, y_align: St.Align.END, expand: true });
      this.favoritesObj = new FavoritesBoxExtended(this, true, this.favoritesLinesNumber);
      this.categoriesScrollBox = new ScrollItemsBox(this, this.categoriesBox, true);
      this.favoritesScrollBox = new ScrollItemsBox(this, this.favoritesBox, true);
      this.favBoxWrapper.add(this.favoritesScrollBox.actor, { y_fill: false, y_align: St.Align.START, expand: true });
      this.categoriesWrapper.add(this.categoriesScrollBox.actor, {x_fill: true, y_fill: true, y_align: St.Align.START, expand: true});
      this.categoriesWrapper.add(this.categoriesSpaceDown, {x_fill: true, y_fill: true, y_align: St.Align.START, expand: true});
      this.standardBox.add(this.favBoxWrapper, { y_align: St.Align.MIDDLE, y_fill: true, expand: false });
      this.standardBox.add(this.rightPane, { span: 2, x_fill: true, expand: true });
      this.rightPane.add_actor(this.spacerTop.actor);
      this.betterPanel.add(this.operativePanel, { x_fill: true, y_fill: true, y_align: St.Align.START, expand: true });
      this.mainBox.add(this.extendedBox, { x_fill: true, y_fill: true, y_align: St.Align.START, expand: true });
      this.extendedBox.add(this.endVerticalBox, { x_fill: true, y_fill: false, y_align: St.Align.END, expand: false });
      this.endHorizontalBox.add(this.selectedAppBox.actor, { x_fill: true, y_fill: false, x_align: St.Align.END, y_align: St.Align.MIDDLE, expand: true });
      this.powerBox = new PowerBox(this, "horizontal", this.iconPowerSize, this.hover, this.selectedAppBox);
      this.endHorizontalBox.add(this.powerBox.actor, { x_fill: false, x_align: St.Align.END, expand: false });
      this.endVerticalBox.add_actor(this.spacerBottom.actor);
      this.endVerticalBox.add(this.endBox, { x_fill: true, y_fill: true, expand: true });
      this.bottomBoxSwaper.add(this.endHorizontalBox, { x_fill: true, y_fill: true, expand: true });
      this.controlBox.set_style('padding-left: 20px;');
      this.searchBox.set_style('padding-left: 0px; padding-top: 10px;');
      this.operativePanel.set_style_class_name('menu-operative-box');
   },

   loadDragon: function() {
      this.operativePanel.set_vertical(true);
      this.categoriesBox.set_vertical(false);
      this.categoriesWrapper.set_vertical(false);
      this.controlSearchBox.add(this.hover.container, {x_fill: false, x_align: St.Align.START, y_align: St.Align.START, expand: true });
      this.controlSearchBox.add(this.controlView.actor, {x_fill: true, x_align: St.Align.END, y_align: St.Align.MIDDLE, y_fill: false, expand: true });
      this.favoritesObj = new FavoritesBoxExtended(this, true, this.favoritesLinesNumber);
      this.operativePanel.add(this.spacerMiddle.actor, {x_fill: true, y_fill: true, y_align: St.Align.START, expand: true});
      this.categoriesScrollBox = new ScrollItemsBox(this, this.categoriesBox, false);
      this.favoritesScrollBox = new ScrollItemsBox(this, this.favoritesBox, true);
      this.favBoxWrapper.add(this.favoritesScrollBox.actor, { y_fill: false, y_align: St.Align.START, expand: true });
      this.categoriesWrapper.add(this.categoriesSpaceUp, {x_fill: true, y_fill: true, y_align: St.Align.START, expand: true});
      this.categoriesWrapper.add(this.categoriesScrollBox.actor, {x_fill: false, y_fill: true, y_align: St.Align.MIDDLE, expand: true});
      this.categoriesWrapper.add(this.categoriesSpaceDown, {x_fill: true, y_fill: true, y_align: St.Align.START, expand: true});
      this.standardBox.add(this.rightPane, { span: 2, x_fill: true, expand: true });
      this.rightPane.add_actor(this.spacerTop.actor);
      this.betterPanel.add(this.favBoxWrapper, { y_align: St.Align.END, y_fill: true, expand: false });
      this.betterPanel.add(this.operativePanelExpanded, { x_fill: true, y_fill: true, y_align: St.Align.START, expand: true });
      this.operativePanelExpanded.add(this.operativePanel, { x_fill: true, y_fill: false, y_align: St.Align.START, expand: true });
      this.mainBox.add(this.extendedBox, { x_fill: true, y_fill: true, y_align: St.Align.START, expand: true });
      this.extendedBox.add(this.endVerticalBox, { x_fill: true, y_fill: false, y_align: St.Align.END, expand: false });
      this.endHorizontalBox.add(this.searchBox, { x_fill: true, y_fill: false, x_align: St.Align.START, y_align: St.Align.MIDDLE, expand: true });
      this.endHorizontalBox.add(this.selectedAppBox.actor, { x_fill: true, y_fill: false, x_align: St.Align.END, y_align: St.Align.MIDDLE, expand: true });
      this.powerBox = new PowerBox(this, "horizontal", this.iconPowerSize, this.hover, this.selectedAppBox);
      this.endHorizontalBox.add(this.powerBox.actor, { x_fill: false, x_align: St.Align.END, expand: false });
      this.endVerticalBox.add_actor(this.spacerBottom.actor);
      this.endVerticalBox.add(this.endBox, { x_fill: true, y_fill: true, expand: true });
      this.bottomBoxSwaper.add(this.endHorizontalBox, { x_fill: true, y_fill: true, expand: true });
      this.searchBox.set_style('');
      this.operativePanelExpanded.set_style_class_name('menu-operative-box');
   },

   loadDragonInverted: function() {
      this.operativePanel.set_vertical(true);
      this.categoriesBox.set_vertical(false);
      this.categoriesWrapper.set_vertical(false);
      this.controlSearchBox.add(this.hover.container, {x_fill: false, x_align: St.Align.MIDDLE, y_align: St.Align.START, expand: true });
      this.controlBox.add(this.controlView.actor, {x_fill: true, y_fill: false, x_align: St.Align.END, y_align: St.Align.MIDDLE, expand: true });
      this.favoritesObj = new FavoritesBoxExtended(this, true, this.favoritesLinesNumber);
      this.operativePanel.add(this.spacerMiddle.actor, {x_fill: true, y_fill: true, y_align: St.Align.START, expand: true});
      this.categoriesScrollBox = new ScrollItemsBox(this, this.categoriesBox, false);
      this.favoritesScrollBox = new ScrollItemsBox(this, this.favoritesBox, true);
      this.favBoxWrapper.add(this.favoritesScrollBox.actor, { y_fill: false, y_align: St.Align.START, expand: true });
      this.categoriesWrapper.add(this.categoriesSpaceUp, {x_fill: true, y_fill: true, y_align: St.Align.START, expand: true});
      this.categoriesWrapper.add(this.categoriesScrollBox.actor, {x_fill: true, y_fill: true, y_align: St.Align.START, expand: true});
      this.categoriesWrapper.add(this.categoriesSpaceDown, {x_fill: true, y_fill: true, y_align: St.Align.START, expand: true});
      this.standardBox.add(this.rightPane, { span: 2, x_fill: true, expand: true });
      this.rightPane.add_actor(this.spacerTop.actor);
      this.operativePanelExpanded.add(this.operativePanel, { x_fill: true, y_fill: false, y_align: St.Align.START, expand: true });
      this.betterPanel.add(this.operativePanelExpanded, { x_fill: true, y_fill: true, y_align: St.Align.START, expand: true });
      this.betterPanel.add(this.favBoxWrapper, { y_align: St.Align.END, y_fill: true, expand: false });
      this.mainBox.add(this.extendedBox, { x_fill: true, y_fill: true, y_align: St.Align.START, expand: true });
      this.extendedBox.add(this.endVerticalBox, { x_fill: true, y_fill: false, y_align: St.Align.END, expand: false });
      this.endHorizontalBox.add(this.searchBox, { x_fill: true, y_fill: false, x_align: St.Align.START, y_align: St.Align.MIDDLE, expand: true });
      this.endHorizontalBox.add(this.selectedAppBox.actor, { x_fill: true, y_fill: false, x_align: St.Align.END, y_align: St.Align.MIDDLE, expand: true });
      this.powerBox = new PowerBox(this, "horizontal", this.iconPowerSize, this.hover, this.selectedAppBox);
      this.endHorizontalBox.add(this.powerBox.actor, { x_fill: false, x_align: St.Align.END, expand: false });
      this.endVerticalBox.add_actor(this.spacerBottom.actor);
      this.endVerticalBox.add(this.endBox, { x_fill: true, y_fill: true, expand: true });
      this.bottomBoxSwaper.add(this.endHorizontalBox, { x_fill: true, y_fill: true, expand: true });
      this.operativePanelExpanded.set_style_class_name('menu-operative-box');
   },

   loadHorizontal: function() {
      this.selectedAppBox.setAlign(St.Align.START);
      this.operativePanel.set_vertical(true);
      this.categoriesBox.set_vertical(false);
      this.categoriesWrapper.set_vertical(false);
      this.favBoxWrapper.set_vertical(false);
      this.controlSearchBox.add(this.hover.container, {x_fill: false, x_align: St.Align.END, y_align: St.Align.MIDDLE, expand: false });
      this.controlSearchBox.add(this.selectedAppBox.actor, { x_fill: false, y_fill: false, x_align: St.Align.START, y_align: St.Align.MIDDLE, expand: true });
      this.favoritesObj = new FavoritesBoxExtended(this, false, this.favoritesLinesNumber);
      this.categoriesScrollBox = new ScrollItemsBox(this, this.categoriesBox, false);
      this.favoritesScrollBox = new ScrollItemsBox(this, this.favoritesBox, false);
      this.favBoxWrapper.add(this.favoritesScrollBox.actor, { x_fill: false, x_align: St.Align.MIDDLE, expand: true });
      this.categoriesWrapper.add(this.categoriesSpaceUp, {x_fill: true, y_fill: true, y_align: St.Align.START, expand: true});
      this.categoriesWrapper.add(this.categoriesScrollBox.actor, {x_fill: false, y_fill: true, y_align: St.Align.MIDDLE, expand: true});
      this.categoriesWrapper.add(this.categoriesSpaceDown, {x_fill: true, y_fill: true, y_align: St.Align.START, expand: true});
      this.standardBox.add(this.rightPane, { span: 2, x_fill: true, expand: true });
      this.rightPane.add_actor(this.spacerTop.actor);
      this.operativePanelExpanded.add(this.operativePanel, { x_fill: true, y_fill: false, y_align: St.Align.START, expand: true });
      this.betterPanel.add(this.operativePanelExpanded, { x_fill: true, y_fill: true, y_align: St.Align.START, expand: true });
      this.operativePanel.add_actor(this.spacerMiddle.actor);
      this.endVerticalBox.add(this.favBoxWrapper, { x_fill: true, y_fill: false, y_align: St.Align.END, expand: true });
      this.endVerticalBox.add(this.spacerBottom.actor);
      this.mainBox.add(this.extendedBox, { x_fill: true, y_fill: true, y_align: St.Align.START, expand: true });
      this.extendedBox.add(this.endVerticalBox, { x_fill: true, y_fill: false, y_align: St.Align.END, expand: false });
      this.powerBox = new PowerBox(this, "horizontal", this.iconPowerSize, this.hover, this.selectedAppBox);
      this.endHorizontalBox.add(this.controlView.actor, { x_fill: false, y_fill: false, x_align: St.Align.START, y_align: St.Align.MIDDLE, expand: false });
      this.endHorizontalBox.add(this.searchBox, { x_fill: false, y_fill: false, x_align: St.Align.MIDDLE, y_align: St.Align.MIDDLE, expand: true });
      this.endHorizontalBox.add(this.powerBox.actor, { x_fill: false, y_fill: false, x_align: St.Align.END, y_align: St.Align.MIDDLE, expand: false });
      this.endVerticalBox.add(this.endBox, { x_fill: true, y_fill: false, y_align: St.Align.END, expand: false });
      this.bottomBoxSwaper.add(this.endHorizontalBox, { x_fill: true, y_fill: true, expand: true });
      this.favoritesBox.style_class = '';
      this.favBoxWrapper.set_style_class_name('menu-favorites-box');
      this.favBoxWrapper.add_style_class_name('menu-favorites-box-' + this.theme);
      this.operativePanelExpanded.set_style_class_name('menu-operative-box');
   },

   loadAccessible: function() {
      this.controlBox.add(this.searchBox, {x_fill: true, x_align: St.Align.END, y_align: St.Align.END, y_fill: false, expand: false });
      this.favoritesObj = new FavoritesBoxExtended(this, true, this.favoritesLinesNumber);
      this.categoriesScrollBox = new ScrollItemsBox(this, this.categoriesBox, true);
      this.favoritesScrollBox = new ScrollItemsBox(this, this.favoritesBox, true);
      this.favBoxWrapper.add(this.favoritesScrollBox.actor, { y_fill: false, y_align: St.Align.START, expand: true });
      this.categoriesWrapper.add(this.categoriesScrollBox.actor, {x_fill: true, y_fill: true, y_align: St.Align.START, expand: true});
      this.categoriesWrapper.add(this.categoriesSpaceDown, {x_fill: true, y_fill: true, y_align: St.Align.START, expand: true});
      this.powerBox = new PowerBox(this, "horizontal", this.iconPowerSize, this.hover, this.selectedAppBox);
      this.accessibleBox = new AccessibleBox(this, this.hover, this.selectedAppBox, this.controlView, this.powerBox, false, this.iconAccessibleSize, this.showRemovable);
      this.accessibleBox.actor.connect('key-press-event', Lang.bind(this, this._onMenuKeyPress));
      this.standardBox.add(this.rightPane, { span: 2, x_fill: true, expand: true });
      this.rightPane.add_actor(this.spacerTop.actor);
      this.betterPanel.add(this.operativePanel, { x_fill: true, y_fill: true, y_align: St.Align.START, expand: true });
      this.betterPanel.add(this.favBoxWrapper, { y_align: St.Align.MIDDLE, y_fill: true, expand: false });
      this.mainBox.add(this.accessibleBox.actor, { y_fill: true, expand: false });
      this.mainBox.add(this.extendedBox, { x_fill: true, y_fill: true, y_align: St.Align.START, expand: true });
      this.extendedBox.add(this.endVerticalBox, { x_fill: true, y_fill: false, y_align: St.Align.END, expand: false });
      this.endHorizontalBox.add(this.selectedAppBox.actor, { x_fill: true, y_fill: false, x_align: St.Align.END, y_align: St.Align.MIDDLE, expand: true });
      this.endVerticalBox.add_actor(this.spacerBottom.actor);
      this.endVerticalBox.add(this.endBox, { x_fill: true, y_fill: false, y_align: St.Align.END, expand: false });
      this.bottomBoxSwaper.add(this.endHorizontalBox, { x_fill: true, y_fill: true, expand: true });
      this.searchBox.set_style('');
      this.operativePanel.set_style_class_name('menu-operative-box');
   },

   loadAccessibleInverted: function() {
      this.controlBox.add(this.searchBox, {x_fill: true, x_align: St.Align.END, y_align: St.Align.END, y_fill: false, expand: false });
      this.favoritesObj = new FavoritesBoxExtended(this, true, this.favoritesLinesNumber);
      this.categoriesScrollBox = new ScrollItemsBox(this, this.categoriesBox, true);
      this.favoritesScrollBox = new ScrollItemsBox(this, this.favoritesBox, true);
      this.favBoxWrapper.add(this.favoritesScrollBox.actor, { y_fill: false, y_align: St.Align.START, expand: true });
      this.categoriesWrapper.add(this.categoriesScrollBox.actor, {x_fill: true, y_fill: true, y_align: St.Align.START, expand: true});
      this.categoriesWrapper.add(this.categoriesSpaceDown, {x_fill: true, y_fill: true, y_align: St.Align.START, expand: true});
      this.powerBox = new PowerBox(this, "horizontal", this.iconPowerSize, this.hover, this.selectedAppBox);
      this.accessibleBox = new AccessibleBox(this, this.hover, this.selectedAppBox, this.controlView, this.powerBox, false, this.iconAccessibleSize, this.showRemovable);
      this.accessibleBox.actor.connect('key-press-event', Lang.bind(this, this._onMenuKeyPress));
      this.standardBox.add(this.rightPane, { span: 2, x_fill: true, expand: true });
      this.rightPane.add_actor(this.spacerTop.actor);
      this.betterPanel.add(this.favBoxWrapper, { y_align: St.Align.MIDDLE, y_fill: true, expand: false });
      this.betterPanel.add(this.operativePanel, { x_fill: true, y_fill: true, y_align: St.Align.START, expand: true });
      this.mainBox.add(this.extendedBox, { x_fill: true, y_fill: true, y_align: St.Align.START, expand: true });
      this.mainBox.add(this.accessibleBox.actor, { y_fill: true });
      this.extendedBox.add(this.endVerticalBox, { x_fill: true, y_fill: false, y_align: St.Align.END, expand: false });
      this.endHorizontalBox.add(this.selectedAppBox.actor, { x_fill: true, y_fill: false, x_align: St.Align.END, y_align: St.Align.MIDDLE, expand: true });
      this.endVerticalBox.add_actor(this.spacerBottom.actor);
      this.endVerticalBox.add(this.endBox, { x_fill: true, y_fill: false, y_align: St.Align.END, expand: false });
      this.bottomBoxSwaper.add(this.endHorizontalBox, { x_fill: true, y_fill: true, expand: true });
      this.operativePanel.set_style_class_name('menu-operative-box');
   },

   loadMint: function() {
      this.allowFavName = true;
      this.controlBox.add(this.panelAppsName, {x_fill: false, y_fill: false, x_align: St.Align.START, y_align: St.Align.MIDDLE, expand: true });
      this.bttChanger = new ButtonChangerBox(this, "forward", 20, [_("All Applications"), _("Favorites")], 0, Lang.bind(this, this._onPanelMintChange));
      this.bttChanger.actor.connect('key-press-event', Lang.bind(this, this._onMenuKeyPress));
      this.controlSearchBox.add(this.bttChanger.actor, {x_fill: false, x_align: St.Align.END, y_align: St.Align.START, expand: true });
      this.favoritesObj = new FavoritesBoxExtended(this, true, this.favoritesLinesNumber);
      this.categoriesScrollBox = new ScrollItemsBox(this, this.categoriesBox, true);
      this.favoritesScrollBox = new ScrollItemsBox(this, this.favoritesBox, true);
      this.favBoxWrapper.add(this.favoritesScrollBox.actor, { x_fill: true, y_fill: true, y_align: St.Align.START, expand: true });
      this.categoriesWrapper.add(this.categoriesScrollBox.actor, {x_fill: true, y_fill: true, y_align: St.Align.START, expand: true});
      this.categoriesWrapper.add(this.categoriesSpaceDown, {x_fill: true, y_fill: true, y_align: St.Align.START, expand: true});
      this.powerBox = new PowerBox(this, "horizontal", this.iconPowerSize, this.hover, this.selectedAppBox);
      this.accessibleBox = new AccessibleBox(this, this.hover, this.selectedAppBox, this.controlView, this.powerBox, false, this.iconAccessibleSize, this.showRemovable);
      this.accessibleBox.actor.connect('key-press-event', Lang.bind(this, this._onMenuKeyPress));
      this.standardBox.add(this.rightPane, { x_fill: true, y_fill: true, expand: true });
      this.betterPanel.set_vertical(true);
      this.betterPanel.add_actor(this.spacerTop.actor);
      this.betterPanel.add(this.favBoxWrapper, { x_fill: true, y_fill: true, y_align: St.Align.MIDDLE, expand: true });
      this.betterPanel.add_actor(this.spacerBottom.actor);
      this.favBoxWrapper.add(this.operativePanel, { x_fill: true, y_fill: true, y_align: St.Align.START, expand: true });
      this.operativePanel.visible = false;
      this.mainBox.add(this.accessibleBox.actor, { y_fill: true });
      this.mainBox.add(this.extendedBox, { x_fill: true, y_fill: true, y_align: St.Align.START, expand: true });
      this.extendedBox.add(this.endVerticalBox, { x_fill: true, y_fill: false, y_align: St.Align.END, expand: false });
      this.endVerticalBox.add(this.endBox, { x_fill: true, y_fill: false, y_align: St.Align.END, expand: false });
      this.bottomBoxSwaper.add(this.endHorizontalBox, { x_fill: true, y_fill: true, expand: true });
      this.endHorizontalBox.add(this.searchBox, {x_fill: true, x_align: St.Align.END, y_align: St.Align.END, y_fill: false, expand: false });
      this.endHorizontalBox.add(this.selectedAppBox.actor, { x_fill: true, y_fill: false, x_align: St.Align.END, y_align: St.Align.MIDDLE, expand: true });
      this.accessibleBox.setNamesVisible(true);
      this.searchName.visible = true;
      this.panelAppsName.visible = true;
      this.favoritesBox.style_class = '';
      this.favBoxWrapper.style_class = 'menu-favorites-box';
      this.favBoxWrapper.add_style_class_name('menu-favorites-box-' + this.theme);
      this.favBoxWrapper.set_style_class_name('menu-operative-mint-box');
      this.selectedAppBox.actor.set_style('padding-right: 0px; padding-left: 4px; text-align: right');
   },

   loadWindows: function() {
      this.allowFavName = true;
      this.bttChanger = new ButtonChangerBox(this, "forward", 20, [_("All Applications"), _("Favorites")], 0, Lang.bind(this, this._onPanelWindowsChange));
      this.bttChanger.actor.connect('key-press-event', Lang.bind(this, this._onMenuKeyPress));
      this.favoritesObj = new FavoritesBoxExtended(this, true, this.favoritesLinesNumber);
      this.categoriesScrollBox = new ScrollItemsBox(this, this.categoriesBox, true);
      this.favoritesScrollBox = new ScrollItemsBox(this, this.favoritesBox, true);
      this.favBoxWrapper.add(this.favoritesScrollBox.actor, { x_fill: true, y_fill: true, y_align: St.Align.START, expand: true });
      this.categoriesWrapper.add(this.categoriesScrollBox.actor, {x_fill: true, y_fill: true, y_align: St.Align.START, expand: true});
      this.categoriesWrapper.add(this.categoriesSpaceDown, {x_fill: true, y_fill: true, y_align: St.Align.START, expand: true});
      this.powerBox = new PowerBox(this, "horizontal", this.iconPowerSize, this.hover, this.selectedAppBox);
      this.accessibleBox = new AccessibleBox(this, this.hover, this.selectedAppBox, this.controlView, this.powerBox, false, this.iconAccessibleSize, this.showRemovable);
      this.accessibleBox.actor.connect('key-press-event', Lang.bind(this, this._onMenuKeyPress));
      this.controlBox.add(this.selectedAppBox.actor, { x_fill: true, y_fill: false, x_align: St.Align.END, y_align: St.Align.MIDDLE, expand: true });
      this.standardBox.add(this.rightPane, { x_fill: true, y_fill: true, expand: true });
      this.betterPanel.set_vertical(true);
      this.betterPanel.add_actor(this.spacerTop.actor);
      this.betterPanel.add(this.favBoxWrapper, { x_fill: true, y_fill: true, y_align: St.Align.MIDDLE, expand: true });
      this.betterPanel.add_actor(this.spacerBottom.actor);
      this.favBoxWrapper.add(this.operativePanel, { x_fill: true, y_fill: true, y_align: St.Align.START, expand: true });
      this.endVerticalBox.add(this.bttChanger.actor, { x_fill: false, x_align: St.Align.START, y_align: St.Align.START, expand: false });
      this.endVerticalBox.add(this.searchBox, { x_fill: false, y_fill: false, x_align: St.Align.START, y_align: St.Align.END, expand: false });
      this.betterPanel.add(this.endBox, { x_fill: true, y_fill: true, y_align: St.Align.END, expand: false });
      this.endHorizontalBox.add(this.endVerticalBox, { x_fill: true, y_fill: true, expand: true });
      this.bottomBoxSwaper.add(this.endHorizontalBox, { x_fill: true, y_fill: true, expand: true });
      this.operativePanel.visible = false;
      this.mainBox.add(this.extendedBox, { x_fill: true, y_fill: true, y_align: St.Align.START, expand: true });
      this.mainBox.add(this.accessibleBox.actor, { y_fill: true });
      this.favoritesBox.set_style_class_name('');
      this.rightPane.set_style_class_name('menu-favorites-box');
      this.rightPane.add_style_class_name('menu-swap-windows-box');
      this.favBoxWrapper.set_style_class_name('menu-operative-windows-box');
      this.topBoxSwaper.set_style_class_name('menu-top-windows-box');
      this.bottomBoxSwaper.set_style_class_name('menu-bottom-windows-box');
   },

 loadGnoMenuLeft: function() {
      this.allowFavName = true;
      this.controlBox.add(this.controlView.actor, {x_fill: true, y_fill: false, x_align: St.Align.START, y_align: St.Align.MIDDLE, expand: true });
      this.controlSearchBox.add(this.hover.container, {x_fill: false, x_align: St.Align.END, y_align: St.Align.MIDDLE, expand: true });
      this.favoritesObj = new FavoritesBoxExtended(this, true, this.favoritesLinesNumber);
      this.powerBox = new PowerBox(this, "horizontal", this.iconPowerSize, this.hover, this.selectedAppBox);
      this.categoriesScrollBox = new ScrollItemsBox(this, this.categoriesBox, true);
      this.categoriesScrollBox.actor.visible = false;
      this.favoritesScrollBox = new ScrollItemsBox(this, this.favoritesBox, true);
      this.categoriesWrapper.add(this.categoriesScrollBox.actor, {x_fill: true, y_fill: true, y_align: St.Align.START, expand: true});
      this.endHorizontalBox.add(this.selectedAppBox.actor, { x_fill: true, y_fill: false, x_align: St.Align.START, y_align: St.Align.MIDDLE, expand: true });
      this.betterPanel.add(this.favBoxWrapper, { y_align: St.Align.MIDDLE, y_fill: true, y_fill: true, expand: false });
      this.standardBox.add(this.rightPane, { span: 2, x_fill: true, expand: true });
      this.rightPane.add_actor(this.spacerTop.actor);
      this.styleGnoMenuPanel = new St.BoxLayout({ style_class: 'menu-gno-operative-box-left', vertical: true });
      this.styleGnoMenuPanel.add(this.operativePanel, { x_fill: true, y_fill: false, y_align: St.Align.START, expand: true });
      this.styleGnoMenuPanel.add(this.favoritesScrollBox.actor, { x_fill: true, y_fill: false, y_align: St.Align.START, expand: true });
      this.betterPanel.add(this.styleGnoMenuPanel, { x_fill: true, y_fill: true, y_align: St.Align.START, expand: true });
      this.mainBox.add(this.extendedBox, { x_fill: true, y_fill: true, y_align: St.Align.START, expand: true });
      this.extendedBox.add_actor(this.spacerBottom.actor);
      this.extendedBox.add(this.endBox, { x_fill: true, y_fill: false, y_align: St.Align.END, expand: false });
      this.gnoMenuBox = new GnoMenuBox(this, this.hover, this.selectedAppBox, this.powerBox, true, this.iconAccessibleSize, Lang.bind(this, this._onPanelGnoMenuChange));
      this.gnoMenuBox.actor.connect('key-press-event', Lang.bind(this, this._onMenuKeyPress));
      this.favBoxWrapper.add(this.gnoMenuBox.actor, { y_fill: true, x_align: St.Align.MIDDLE, y_align: St.Align.START, expand: true });
      this.endVerticalBox.add_actor(this.searchBox);
      this.endVerticalBox.add(this.endHorizontalBox, { x_fill: true, y_fill: true, expand: true });
      this.bottomBoxSwaper.add(this.endVerticalBox, { x_fill: true, y_fill: true, expand: true });
      this.selectedAppBox.setAlign(St.Align.START);
      this.operativePanel.visible = false;
      this.favoritesBox.set_style_class_name('menu-applications-box');
      this.selectedAppBox.actor.set_style('padding-left: 0px; text-align: left');
   },

   loadGnoMenuRight: function() {
      this.allowFavName = true;
      this.controlBox.add(this.controlView.actor, {x_fill: true, y_fill: false, x_align: St.Align.START, y_align: St.Align.MIDDLE, expand: true });
      this.controlSearchBox.add(this.hover.container, {x_fill: false, x_align: St.Align.END, y_align: St.Align.MIDDLE, expand: true });
      this.favoritesObj = new FavoritesBoxExtended(this, true, this.favoritesLinesNumber);
      this.powerBox = new PowerBox(this, "horizontal", this.iconPowerSize, this.hover, this.selectedAppBox);
      this.categoriesScrollBox = new ScrollItemsBox(this, this.categoriesBox, true);
      this.categoriesScrollBox.actor.visible = false;
      this.favoritesScrollBox = new ScrollItemsBox(this, this.favoritesBox, true);
      this.categoriesWrapper.add(this.categoriesScrollBox.actor, {x_fill: true, y_fill: true, y_align: St.Align.START, expand: true});
      this.endHorizontalBox.add(this.selectedAppBox.actor, { x_fill: true, y_fill: false, x_align: St.Align.START, y_align: St.Align.MIDDLE, expand: true });
      this.standardBox.add(this.rightPane, { span: 2, x_fill: true, expand: true });
      this.rightPane.add_actor(this.spacerTop.actor);
      this.styleGnoMenuPanel = new St.BoxLayout({ style_class: 'menu-gno-operative-box-right', vertical: true });
      this.styleGnoMenuPanel.add(this.operativePanel, { x_fill: true, y_fill: false, y_align: St.Align.START, expand: true });
      this.styleGnoMenuPanel.add(this.favoritesScrollBox.actor, { x_fill: true, y_fill: false, y_align: St.Align.START, expand: true });
      this.betterPanel.add(this.styleGnoMenuPanel, { x_fill: true, y_fill: true, y_align: St.Align.START, expand: true });
      this.betterPanel.add(this.favBoxWrapper, { y_align: St.Align.MIDDLE, y_fill: true, y_fill: true, expand: false });
      this.mainBox.add(this.extendedBox, { x_fill: true, y_fill: true, y_align: St.Align.START, expand: true });
      this.extendedBox.add_actor(this.spacerBottom.actor);
      this.extendedBox.add(this.endBox, { x_fill: true, y_fill: false, y_align: St.Align.END, expand: false });
      this.gnoMenuBox = new GnoMenuBox(this, this.hover, this.selectedAppBox, this.powerBox, true, this.iconAccessibleSize, Lang.bind(this, this._onPanelGnoMenuChange));
      this.gnoMenuBox.actor.connect('key-press-event', Lang.bind(this, this._onMenuKeyPress));
      this.favBoxWrapper.add(this.gnoMenuBox.actor, { y_fill: true, x_align: St.Align.MIDDLE, y_align: St.Align.START, expand: true });
      this.endVerticalBox.add_actor(this.searchBox);
      this.endVerticalBox.add(this.endHorizontalBox, { x_fill: true, y_fill: true, expand: true });
      this.bottomBoxSwaper.add(this.endVerticalBox, { x_fill: true, y_fill: true, expand: true });
      this.selectedAppBox.setAlign(St.Align.START);
      this.operativePanel.visible = false;
      this.favoritesBox.set_style_class_name('menu-applications-box');
      this.selectedAppBox.actor.set_style('padding-left: 0px; text-align: left');
   },

   loadGnoMenuTop: function() {
      this.allowFavName = true;
      this.controlBox.add(this.controlView.actor, {x_fill: true, y_fill: false, x_align: St.Align.START, y_align: St.Align.MIDDLE, expand: true });
      this.controlSearchBox.add(this.hover.container, {x_fill: false, x_align: St.Align.END, y_align: St.Align.MIDDLE, expand: true });
      this.favoritesObj = new FavoritesBoxExtended(this, true, this.favoritesLinesNumber);
      this.powerBox = new PowerBox(this, "horizontal", this.iconPowerSize, this.hover, this.selectedAppBox);
      this.categoriesScrollBox = new ScrollItemsBox(this, this.categoriesBox, true);
      this.categoriesScrollBox.actor.visible = false;
      this.favoritesScrollBox = new ScrollItemsBox(this, this.favoritesBox, true);
      this.categoriesWrapper.add(this.categoriesScrollBox.actor, {x_fill: true, y_fill: true, y_align: St.Align.START, expand: true});
      this.betterPanel.add(this.favBoxWrapper, { y_align: St.Align.MIDDLE, y_fill: true, y_fill: true, expand: false });
      this.standardBox.add(this.rightPane, { span: 2, x_fill: true, expand: true });
      this.styleGnoMenuPanel = new St.BoxLayout({ style_class: 'menu-gno-operative-box-top', vertical: true });
      this.styleGnoMenuPanel.add(this.operativePanel, { x_fill: true, y_fill: false, y_align: St.Align.START, expand: true });
      this.styleGnoMenuPanel.add(this.favoritesScrollBox.actor, { x_fill: true, y_fill: false, y_align: St.Align.START, expand: true });
      this.betterPanel.add(this.styleGnoMenuPanel, { x_fill: true, y_fill: true, y_align: St.Align.START, expand: true });
      this.gnoMenuBox = new GnoMenuBox(this, this.hover, this.selectedAppBox, this.powerBox, false, this.iconAccessibleSize, Lang.bind(this, this._onPanelGnoMenuChange));
      this.gnoMenuBox.actor.connect('key-press-event', Lang.bind(this, this._onMenuKeyPress));
      this.rightPane.add_actor(this.spacerTop.actor);
      this.rightPane.add_actor(this.gnoMenuBox.actor);
      this.rightPane.add_actor(this.spacerMiddle.actor);
      this.mainBox.add(this.extendedBox, { x_fill: true, y_fill: true, y_align: St.Align.START, expand: true });
      this.extendedBox.add_actor(this.spacerBottom.actor);
      this.extendedBox.add(this.endBox, { x_fill: true, y_fill: false, y_align: St.Align.END, expand: false });
      this.endHorizontalBox.add_actor(this.searchBox);
      this.endHorizontalBox.add(this.selectedAppBox.actor, { x_fill: true, y_fill: false, x_align: St.Align.START, y_align: St.Align.MIDDLE, expand: true });
      this.endVerticalBox.add(this.endHorizontalBox, { x_fill: true, y_fill: true, expand: true });
      this.bottomBoxSwaper.add(this.endVerticalBox, { x_fill: true, y_fill: true, expand: true });
      this.selectedAppBox.setAlign(St.Align.START);
      this.operativePanel.visible = false;
      this.favoritesBox.set_style_class_name('menu-applications-box');
   },

   loadGnoMenuBottom: function() {
      this.allowFavName = true;
      this.controlBox.add(this.controlView.actor, {x_fill: true, y_fill: false, x_align: St.Align.START, y_align: St.Align.MIDDLE, expand: true });
      this.controlSearchBox.add(this.hover.container, {x_fill: false, x_align: St.Align.END, y_align: St.Align.MIDDLE, expand: true });
      this.favoritesObj = new FavoritesBoxExtended(this, true, this.favoritesLinesNumber);
      this.powerBox = new PowerBox(this, "horizontal", this.iconPowerSize, this.hover, this.selectedAppBox);
      this.categoriesScrollBox = new ScrollItemsBox(this, this.categoriesBox, true);
      this.categoriesScrollBox.actor.visible = false;
      this.favoritesScrollBox = new ScrollItemsBox(this, this.favoritesBox, true);
      this.categoriesWrapper.add(this.categoriesScrollBox.actor, {x_fill: true, y_fill: true, y_align: St.Align.START, expand: true});
      this.betterPanel.add(this.favBoxWrapper, { y_align: St.Align.MIDDLE, y_fill: true, y_fill: true, expand: false });
      this.standardBox.add(this.rightPane, { span: 2, x_fill: true, expand: true });
      this.styleGnoMenuPanel = new St.BoxLayout({ style_class: 'menu-gno-operative-box-bottom', vertical: true });
      this.styleGnoMenuPanel.add(this.operativePanel, { x_fill: true, y_fill: false, y_align: St.Align.START, expand: true });
      this.styleGnoMenuPanel.add(this.favoritesScrollBox.actor, { x_fill: true, y_fill: false, y_align: St.Align.START, expand: true });
      this.gnoMenuBox = new GnoMenuBox(this, this.hover, this.selectedAppBox, this.powerBox, false, this.iconAccessibleSize, Lang.bind(this, this._onPanelGnoMenuChange));
      this.gnoMenuBox.actor.connect('key-press-event', Lang.bind(this, this._onMenuKeyPress));
      this.rightPane.add_actor(this.spacerTop.actor);
      this.rightPane.add(this.styleGnoMenuPanel, { x_fill: true, y_fill: true, y_align: St.Align.START, expand: true });
      this.mainBox.add(this.extendedBox, { x_fill: true, y_fill: true, y_align: St.Align.START, expand: true });
      this.extendedBox.add_actor(this.spacerMiddle.actor);
      this.extendedBox.add_actor(this.gnoMenuBox.actor);
      this.extendedBox.add_actor(this.spacerBottom.actor);
      this.extendedBox.add(this.endBox, { x_fill: true, y_fill: false, y_align: St.Align.END, expand: false });
      this.endHorizontalBox.add_actor(this.searchBox);
      this.endHorizontalBox.add(this.selectedAppBox.actor, { x_fill: true, y_fill: false, x_align: St.Align.START, y_align: St.Align.MIDDLE, expand: true });
      this.endVerticalBox.add(this.endHorizontalBox, { x_fill: true, y_fill: true, expand: true });
      this.bottomBoxSwaper.add(this.endVerticalBox, { x_fill: true, y_fill: true, expand: true });
      this.selectedAppBox.setAlign(St.Align.START);
      this.operativePanel.visible = false;
      this.favoritesBox.set_style_class_name('menu-applications-box');
   },

   _onPanelGnoMenuChange: function(selected) {
      if(selected == _("Favorites")) {
         this._activeContainer = null;
         this.operativePanel.visible = false;
         this.favoritesScrollBox.actor.visible = true;
      } else {
         this.favoritesScrollBox.actor.visible = false;
         this.operativePanel.visible = true;
         let selectedButton;
         if(selected == _("All Applications"))
            selectedButton = this._allAppsCategoryButton;
         else if(selected == _("Places"))
            selectedButton = this.placesButton;
         else if(selected == _("Recent Files"))
            selectedButton = this.recentButton;
         if(selectedButton) {
            this._clearPrevCatSelection(selectedButton.actor);
            selectedButton.actor.style_class = "menu-category-button-selected";
            if(selected == _("All Applications"))
               this._select_category(null, selectedButton);
            else if(selected == _("Places"))
               this._displayButtons(null, -1);
            else if(selected == _("Recent Files"))
               this._displayButtons(null, null, -1);
            //this._previousTreeItemIndex = this._selectedItemIndex;
            //this._previousSelectedActor = null;
            //this._previousVisibleIndex = this.categoriesBox.get_child_at_index(0).get_children().indexOf(selectedButton.actor);
            this._previousTreeItemIndex = this._previousVisibleIndex;
            let index = this.categoriesBox.get_child_at_index(0).get_children().indexOf(selectedButton.actor)
            this._previousTreeSelectedActor = this.categoriesBox.get_child_at_index(0).get_child_at_index(index);
            this._activeContainer = this.categoriesBox;
         }
      }
      this._updateSize();
   },

   _onPanelMintChange: function(selected) {
      global.stage.set_key_focus(this.searchEntry);
      let operPanelVisible = false;
      let titleAppBar = _("All Applications");
      if(titleAppBar == selected) {
         this.panelAppsName.set_text(_("Favorites"));
         operPanelVisible = true;
      } else {
         this.panelAppsName.set_text(_("All Applications"));
      }
      this._clearView();
      this.operativePanel.visible = !operPanelVisible;
      this.favoritesScrollBox.actor.visible = operPanelVisible;
      this._updateSize();
   },

   _onPanelWindowsChange: function(selected) {
      global.stage.set_key_focus(this.searchEntry);
      let operPanelVisible = false;
      let titleAppBar = _("All Applications");
      if(titleAppBar == selected) {
         this.accessibleBox.takeHover(true);
         operPanelVisible = true;
      }
      else {
         this.accessibleBox.takeHover(false);
         this.controlSearchBox.add_actor(this.hover.container);
      }
      this._clearView();
      this.powerBox.actor.visible = operPanelVisible;
      this.hover.actor.visible = operPanelVisible;
      this.hover.container.visible = operPanelVisible;
      if(this.accessibleBox)
         this.accessibleBox.hoverBox.visible = this.showHoverIcon;
      this.accessibleBox.actor.visible = operPanelVisible;
      this.operativePanel.visible = !operPanelVisible;
      this.favoritesScrollBox.actor.visible = operPanelVisible;
     /* if((this.showAppTitle)||(this.showAppDescription))
         this.endHorizontalBox.visible = !operPanelVisible;*/

      this._updateSize();
   },

   _listBookmarks: function(pattern) {
       let bookmarks = Main.placesManager.getBookmarks();
       let special = this._listSpecialBookmarks();
       var res = new Array();
       for (let id = 0; id < special.length; id++) {
          if (!pattern || special[id].name.toLowerCase().indexOf(pattern)!=-1) res.push(special[id]);
       }
       for (let id = 0; id < bookmarks.length; id++) {
          if (!pattern || bookmarks[id].name.toLowerCase().indexOf(pattern)!=-1) res.push(bookmarks[id]);
       }
       return res;
   },

   _listSpecialBookmarks: function() {
      if(!this.specialBookmarks) {
         this.specialBookmarks = new Array();
         this.specialBookmarks.push(new SpecialBookmarks(_("Computer"), "computer", "computer:///"));
         this.specialBookmarks.push(new SpecialBookmarks(_("Home"), "folder-home", GLib.get_home_dir()));
         this.specialBookmarks.push(new SpecialBookmarks(_("Desktop"), "desktop", USER_DESKTOP_PATH));
         this.specialBookmarks.push(new SpecialBookmarks(_("Networking"), "network", "network:///"));
         this.specialBookmarks.push(new SpecialBookmarks(_("Trash"), "user-trash", "trash:///"));
      }
      return this.specialBookmarks;
   },

   _clearAllSelections: function(hide_apps) {
       for(let i = 0; i < this._applicationsButtons.length; i++) {
          this._applicationsButtons[i].actor.style_class = "menu-application-button";
          if(hide_apps) {
             this._applicationsButtons[i].actor.hide();
          }
       }
       for(let i = 0; i < this._categoryButtons.length; i++){
          let actor = this._categoryButtons[i].actor;
          actor.set_style_class_name('menu-category-button');
          actor.add_style_class_name('menu-category-button-' + this.theme);
          actor.show();
       }
    },

    _setCategoriesButtonActive: function(active) {         
       try {
          for(let i = 0; i < this._categoryButtons.length; i++) {
             let button = this._categoryButtons[i].actor;
             if(active) {
                button.set_style_class_name('menu-category-button');
                button.add_style_class_name('menu-category-button-' + this.theme);
             } else {
                button.set_style_class_name('menu-category-button-greyed');
                button.add_style_class_name('menu-category-button-greyed-' + this.theme);
             }
          }
       } catch (e) {
          global.log(e);
       }
   },

   _clearPrevCatSelection: function(actor) {
      if(this._previousTreeSelectedActor && this._previousTreeSelectedActor != actor) {
         this._previousTreeSelectedActor.set_style_class_name('menu-category-button');
         this._previousTreeSelectedActor.add_style_class_name('menu-category-button-' + this.theme);
         if(this._previousTreeSelectedActor._delegate) {
            this._previousTreeSelectedActor._delegate.emit('leave-event');
         }

         if(actor !== undefined) {
            this._previousVisibleIndex = null;
            this._previousTreeSelectedActor = actor;
         }
      } else {
         for(let i = 0; i < this._categoryButtons.length; i++) {
            this._categoryButtons[i].actor.set_style_class_name('menu-category-button');
            this._categoryButtons[i].actor.add_style_class_name('menu-category-button-' + this.theme);
         }
      }
   },

   _select_category: function(dir, categoryButton) {
      if(dir)
         this._displayButtons(this._listApplications(dir.get_menu_id()));
      else
         this._displayButtons(this._listApplications(null));
      this.closeApplicationsContextMenus(null, false);
   },

   closeApplicationsContextMenus: function(excludeApp, animate) {
      for(var app in this._applicationsButtons) {
         if((app!=excludeApp)&&(this._applicationsButtons[app].menu)&&(this._applicationsButtons[app].menu.isOpen)) {
            if(animate)
               this._applicationsButtons[app].toggleMenu();
            else
               this._applicationsButtons[app].closeMenu();
         }
      }
      for(var app in this._favoritesButtons) {
         if((app!=excludeApp)&&(this._favoritesButtons[app].menu)&&(this._favoritesButtons[app].menu.isOpen)) {
            if(animate)
               this._favoritesButtons[app].toggleMenu();
            else
               this._favoritesButtons[app].closeMenu();
         }
      }
      for(var app in this._placesButtons) {
         if((app!=excludeApp)&&(this._placesButtons[app].menu)&&(this._placesButtons[app].menu.isOpen)) {
            if(animate)
               this._placesButtons[app].toggleMenu();
            else
               this._placesButtons[app].closeMenu();
         }
      }
      if(this.accessibleBox)
         this.accessibleBox.closeContextMenus(excludeApp, animate);
   },

   _displayButtons: function(appCategory, places, recent, apps, autocompletes) {
      if(appCategory) {
         if(appCategory == "all") {
            for(let i = 0; i < this._applicationsButtons.length; i++) {
               if(!this._applicationsButtons[i].actor.visible) {
                  this._applicationsButtons[i].actor.visible = true;//.show();
               }
            }
         } else {
            for(let i = 0; i < this._applicationsButtons.length; i++) {
               if(this._applicationsButtons[i].category.indexOf(appCategory) != -1) {
                  if(!this._applicationsButtons[i].actor.visible) {
                     this._applicationsButtons[i].actor.visible = true;//.show();
                  }
               } else {
                  if(this._applicationsButtons[i].actor.visible) {
                     this._applicationsButtons[i].actor.visible = false;//.hide();
                  }
               }
            }
         }
      } else if(apps) {
         for(let i = 0; i < this._applicationsButtons.length; i++) {
            if(apps.indexOf(this._applicationsButtons[i].name) != -1) {
               if(!this._applicationsButtons[i].actor.visible) {
                  this._applicationsButtons[i].actor.visible = true;//.show();
               }
            } else {
               if(this._applicationsButtons[i].actor.visible) {
                  this._applicationsButtons[i].actor.visible = false;//.hide();
               }
            }
         }
      } else {
         for(let i = 0; i < this._applicationsButtons.length; i++) {
            if(this._applicationsButtons[i].actor.visible) {
               this._applicationsButtons[i].actor.visible = false;//.hide();
            }
         }
      }
      if(places) {
         if(places == -1) {
            for(let i = 0; i < this._placesButtons.length; i++) {
               this._placesButtons[i].actor.visible = true;//.show();
            }
         } else {
            for(let i = 0; i < this._placesButtons.length; i++) {
               if(places.indexOf(this._placesButtons[i].button_name) != -1) {
                  if(!this._placesButtons[i].actor.visible) {
                     this._placesButtons[i].actor.visible = true;//.show();
                  }
               } else {
                  if(this._placesButtons[i].actor.visible) {
                     this._placesButtons[i].actor.visible = false;//.hide();
                  }
               }
            }
         }
      } else {
         for(let i = 0; i < this._placesButtons.length; i++) {
            if(this._placesButtons[i].actor.visible) {
               this._placesButtons[i].actor.visible = false;//.hide();
            }
         }
      }
      if(recent) {
         if(recent == -1) {
            for(let i = 0; i < this._recentButtons.length; i++) {
               if(!this._recentButtons[i].actor.visible) {
                  this._recentButtons[i].actor.visible = true;//.show();
               }
            }
         } else {
            for(let i = 0; i < this._recentButtons.length; i++) {
               if(recent.indexOf(this._recentButtons[i].button_name) != -1) {
                  if(!this._recentButtons[i].actor.visible) {
                     this._recentButtons[i].actor.visible = true;//.show();
                  }
               } else {
                  if(this._recentButtons[i].actor.visible) {
                     this._recentButtons[i].actor.visible = false;//.hide();
                  }
               }
            }
         }
      } else {
         for(let i = 0; i < this._recentButtons.length; i++) {
            if(this._recentButtons[i].actor.visible) {
               this._recentButtons[i].actor.visible = false;//.hide();
            }
         }
      }

      for(indexT in this._transientButtons) {
         let parentTrans = this._transientButtons[indexT].actor.get_parent();
         if(parentTrans)
            parentTrans.remove_actor(this._transientButtons[indexT].actor);
         this._transientButtons[indexT].actor.destroy();
      }
      this._transientButtons = new Array();
      if(autocompletes) {
         let viewBox;
         for(let i = 0; i < autocompletes.length; i++) {
            let button = new TransientButtonExtended(this, this.applicationsScrollBox, autocompletes[i], this.iconAppSize, this.iconView,
                                                     this.textButtonWidth, this.appButtonDescription);
            if(this._applicationsBoxWidth > 0)
               button.container.set_width(this._applicationsBoxWidth);
            //button.actor.connect('realize', Lang.bind(this, this._onApplicationButtonRealized));
            button.actor.connect('leave-event', Lang.bind(this, this._appLeaveEvent, button));
            this._addEnterEvent(button, Lang.bind(this, this._appEnterEvent, button));
            this._transientButtons.push(button);
            button.actor.visible = true;
            button.actor.realize();
            if(!this.iconView) {
               //button.setVertical(this.iconView);
               viewBox = new St.BoxLayout({ vertical: true });
               viewBox.add_actor(button.actor);
               this.applicationsBox.add_actor(viewBox);
            }
         }
      }
      this._updateView();
   },

   _onApplicationButtonRealized: function(actor) {
      if(actor.get_width() > this._applicationsBoxWidth) {
         this._applicationsBoxWidth = actor.get_width(); // The answer to life...
         //this.applicationsBox.set_width(this.iconViewCount*this._applicationsBoxWidth + 42);
      }
   },

   _refreshFavs: function() {
      if(this.fRef) return false;
      this.fRef = true;
      //Remove all favorites
      /*this.favoritesBox.get_children().forEach(Lang.bind(this, function (child) {
          child.destroy();
      }));
      this.favoritesObj = new FavoritesBoxExtended(this, true, this.favoritesLinesNumber);
      this.favoritesBox.add(this.favoritesObj.actor, { x_fill: true, y_fill: true, x_align: St.Align.END, y_align: St.Align.MIDDLE, expand: false });

     /* let favoritesBox = new CinnamonMenu.FavoritesBox();
      this.favoritesBox.add_actor(favoritesBox.actor);*/
      //this.favoritesScrollBox.set_width(-1)
      //this.favoritesBox.set_width(-1);

      this.favoritesObj.removeAll();
      if(this.favoritesObj.getNumberLines() != this.favoritesLinesNumber)
         this.favoritesObj.setNumberLines(this.favoritesLinesNumber);
         
      //Load favorites again
      this._favoritesButtons = new Array();
      let launchers = global.settings.get_strv('favorite-apps');
      let appSys = Cinnamon.AppSystem.get_default();
      let j = 0;
      for(let i = 0; i < launchers.length; ++i) {
         let app = appSys.lookup_app(launchers[i]);
         if(app) {
            let button = new FavoritesButtonExtended(this, this.favoritesScrollBox, this.iconView, this.favoritesObj.getVertical(),
                                                     app, "", launchers.length/this.favoritesLinesNumber, this.iconMaxFavSize,
                                                     this.allowFavName, this.textButtonWidth, this.appButtonDescription, this._applicationsBoxWidth);
            // + 3 because we're adding 3 system buttons at the bottom
            //button.actor.style = "padding-top: "+(2)+"px;padding-bottom: "+(2)+"px;padding-left: "+(4)+"px;padding-right: "+(-5)+"px;margin:auto;";
            this._favoritesButtons[app] = button;
            this.favoritesObj.add(button.actor, button.menu, { y_align: St.Align.MIDDLE, x_align: St.Align.MIDDLE, y_fill: false, expand: true });
            //favoritesBox.actor.add(button.actor, { y_align: St.Align.MIDDLE, x_align: St.Align.MIDDLE, y_fill: false, expand: true });
            button.actor.connect('enter-event', Lang.bind(this, function() {
               this._clearPrevCatSelection();
               this.hover.refreshApp(button.app);
               if(button.app.get_description())
                  this.selectedAppBox.setSelectedText(button.app.get_name(), button.app.get_description().split("\n")[0]);
               else
                  this.selectedAppBox.setSelectedText(button.app.get_name(), "");
            }));
            button.actor.connect('leave-event', Lang.bind(this, function() {
               this.selectedAppBox.setSelectedText("", "");
               this.hover.refreshFace();
            }));
            button.actor.connect('key-press-event', Lang.bind(this, this._onMenuKeyPress));
            ++j;
         }
      }

      this.fRef = false;
      return true;
   },

   _refreshApps: function() {
      for(let i = 0; i < this._categoryButtons.length; i++)
         this._categoryButtons[i].actor.destroy();
      this.applicationsBox.destroy_all_children();
      this._applicationsButtons = new Array();
      this._transientButtons = new Array();
      this._categoryButtons = new Array();
      this._applicationsButtonFromApp = new Object(); 
      this._applicationsBoxWidth = 0;
      this._activeContainer = null;
      //this.favoritesScrollBox.set_width(-1);
      //Remove all categories
      this._clearView();
      this.iconViewCount = 1;
      this.categoriesBox.destroy_all_children();

      this._allAppsCategoryButton = new CategoryButtonExtended(null, this.iconCatSize, this.showCategoriesIcons);
      this._addEnterEvent(this._allAppsCategoryButton, Lang.bind(this, function() {
         if(!this.searchActive) {
            this._allAppsCategoryButton.isHovered = true;
            if(this.hover_delay > 0) {
               Tweener.addTween(this, {
                  time: this.hover_delay, onComplete: function () {
                     if(this._allAppsCategoryButton.isHovered) {
                        this._clearPrevCatSelection(this._allAppsCategoryButton.actor);
                        this._allAppsCategoryButton.actor.set_style_class_name('menu-category-button-selected');
                        this._allAppsCategoryButton.actor.add_style_class_name('menu-category-button-selected-' + this.theme);
                        this._select_category(null, this._allAppsCategoryButton);
                     } else {
                        this._allAppsCategoryButton.actor.set_style_class_name('menu-category-button-selected');
                        this._allAppsCategoryButton.actor.add_style_class_name('menu-category-button-selected-' + this.theme);
                     }
                  }
               });
            } else {
               this._clearPrevCatSelection(this._allAppsCategoryButton.actor);
               this._allAppsCategoryButton.actor.set_style_class_name('menu-category-button-selected');
               this._allAppsCategoryButton.actor.add_style_class_name('menu-category-button-selected-' + this.theme);
               this._select_category(null, this._allAppsCategoryButton);
            }
            this.makeVectorBox(this._allAppsCategoryButton.actor);
         }
      }));
      this._allAppsCategoryButton.actor.connect('leave-event', Lang.bind(this, function () {
         this._previousSelectedActor = this._allAppsCategoryButton.actor;
         this._allAppsCategoryButton.isHovered = false;
      }));
      //this.categoriesBox.add_actor(this._allAppsCategoryButton.actor);
      this._categoryButtons.push(this._allAppsCategoryButton);

      let trees = [appsys.get_tree()];

      for(var i in trees) {
         let tree = trees[i];
         let root = tree.get_root_directory();
            
         let iter = root.iter();
         let nextType;
         while((nextType = iter.next()) != GMenu.TreeItemType.INVALID) {
            if(nextType == GMenu.TreeItemType.DIRECTORY) {
               let dir = iter.get_directory();
               if(dir.get_is_nodisplay())
                  continue;
               if(this._loadCategory(dir)) {
                  let categoryButton = new CategoryButtonExtended(dir, this.iconCatSize, this.showCategoriesIcons);
                  this._addEnterEvent(categoryButton, Lang.bind(this, function() {
                     if(!this.searchActive) {
                        categoryButton.isHovered = true;
                        if(this.hover_delay > 0) {
                           Tweener.addTween(this, {
                              time: this.hover_delay, onComplete: function () {
                                 if(categoryButton.isHovered) {
                                    this._clearPrevCatSelection(categoryButton.actor);
                                    categoryButton.actor.set_style_class_name('menu-category-button-selected');
                                    categoryButton.actor.add_style_class_name('menu-category-button-selected-' + this.theme);
                                    this._select_category(dir, categoryButton);
                                 } else {
                                    categoryButton.actor.set_style_class_name('menu-category-button');
                                    categoryButton.actor.add_style_class_name('menu-category-button-' + this.theme);
                                 }
                              }
                           });
                        } else {
                           this._clearPrevCatSelection(categoryButton.actor);
                           categoryButton.actor.set_style_class_name('menu-category-button-selected');
                           categoryButton.actor.add_style_class_name('menu-category-button-selected-' + this.theme);
                           this._select_category(dir, categoryButton);
                        }
                        this.makeVectorBox(categoryButton.actor);
                     }
                  }));
                  categoryButton.actor.connect('leave-event', Lang.bind(this, function () {
                     if(this._previousTreeSelectedActor === null) {
                        this._previousTreeSelectedActor = categoryButton.actor;
                     } else {
                        let prevIdx = this.catBoxIter.getVisibleIndex(this._previousTreeSelectedActor);
                        let nextIdx = this.catBoxIter.getVisibleIndex(categoryButton.actor);
                        if(Math.abs(prevIdx - nextIdx) <= 1) {
                           this._previousTreeSelectedActor = categoryButton.actor;
                        }
                     }
                     categoryButton.isHovered = false;
                  }));
                 // this.categoriesBox.add_actor(categoryButton.actor);
                  this._categoryButtons.push(categoryButton);
               }
            }
         } 
      }
      // Sort apps and add to applicationsBox
      this._applicationsButtons.sort(function(a, b) {
         let sr = a.app.get_name().toLowerCase() > b.app.get_name().toLowerCase();
         return sr;
      });
      try {
      //Mainloop.idle_add(Lang.bind(this, function() {

         let catVertical = !this.categoriesBox.get_vertical();
         if(this.categoriesBox.get_children().length == 0)
            this.categoriesBox.add_actor(new St.BoxLayout({ vertical: this.categoriesBox.get_vertical() }));
         let viewBox = this.categoriesBox.get_children()[0];
         for(let i = 0; i < this._categoryButtons.length; i++) {
            this._categoryButtons[i].setVertical(catVertical);
            viewBox.add_actor(this._categoryButtons[i].actor);
         }
         //Main.notify("Fueron:" + viewBox.get_children().length);

         this._clearPrevCatSelection(this._allAppsCategoryButton.actor);
         this._allAppsCategoryButton.actor.set_style_class_name('menu-category-button-selected');
         this._allAppsCategoryButton.actor.add_style_class_name('menu-category-button-selected-' + this.theme);
         this._select_category(null, this._allAppsCategoryButton);
      } catch(e) {Main.notify("errr", e.message);}
     // }));
      this._refreshPlacesAndRecent();
   },

   _refreshPlacesAndRecent : function() {
      let newCatSelection = new Array();
      for(let i = 0; i < this._placesButtons.length; i ++) {
         this._placesButtons[i].actor.destroy();
      }
      for(let i = 0; i < this._recentButtons.length; i ++) {
         this._recentButtons[i].actor.destroy();
      }
      if(this.categoriesBox.get_children().length == 0)
         this.categoriesBox.add_actor(new St.BoxLayout({ vertical: this.categoriesBox.get_vertical() }));
      let tempCat;
      for(let i = 0; i < this._categoryButtons.length; i++) {
         tempCat = this._categoryButtons[i]
         if(!(tempCat instanceof PlaceCategoryButtonExtended) && 
            !(tempCat instanceof RecentCategoryButtonExtended)) {
            newCatSelection.push(this._categoryButtons[i]);
         } else {
            this.categoriesBox.get_children()[0].remove_actor(this._categoryButtons[i].actor);
            this._categoryButtons[i].actor.destroy();
         }
      }
      this._categoryButtons = newCatSelection;
      //Main.notify("puedo" + this.showPlaces);
      this._placesButtons = new Array();
      this._recentButtons = new Array();

      if(this.gnoMenuBox) {
         this.gnoMenuBox.showPlaces(this.showPlaces);
         this.gnoMenuBox.showRecents(this.showRecent);
      }
      // Now generate Places category and places buttons and add to the list
      if(this.showPlaces) {
         this.placesButton = new PlaceCategoryButtonExtended(null, this.iconCatSize, this.showCategoriesIcons);
         this._addEnterEvent(this.placesButton, Lang.bind(this, function() {
            if(!this.searchActive) {
               this.placesButton.isHovered = true;
               if(this.hover_delay > 0) {
                  Tweener.addTween(this, {
                     time: this.hover_delay, onComplete: function () {
                        if(this.placesButton.isHovered) {
                           this._clearPrevCatSelection(this.placesButton.actor);
                           this.placesButton.actor.set_style_class_name('menu-category-button-selected');
                           this.placesButton.actor.add_style_class_name('menu-category-button-selected-' + this.theme);
                           this._displayButtons(null, -1);
                        }
                     }
                  });
               } else {
                  this._clearPrevCatSelection(this.placesButton.actor);
                  this.placesButton.actor.set_style_class_name('menu-category-button-selected');
                  this.placesButton.actor.add_style_class_name('menu-category-button-selected-' + this.theme);
                  this._displayButtons(null, -1);
               }
               this.makeVectorBox(this.placesButton.actor);
            }
         }));
         this.placesButton.actor.connect('leave-event', Lang.bind(this, function () {
            if(this._previousTreeSelectedActor === null) {
               this._previousTreeSelectedActor = this.placesButton.actor;
            } else {
               let prevIdx = this.catBoxIter.getVisibleIndex(this._previousTreeSelectedActor);
               let nextIdx = this.catBoxIter.getVisibleIndex(this.placesButton.actor);
               let idxDiff = Math.abs(prevIdx - nextIdx);
               let numVisible = this.catBoxIter.getNumVisibleChildren();
               if(idxDiff <= 1 || Math.min(prevIdx, nextIdx) < 0) {
                  this._previousTreeSelectedActor = this.placesButton.actor;
               }
            }

            this.placesButton.isHovered = false;
         }));
         this._categoryButtons.push(this.placesButton);
         this.placesButton.setVertical(!this.categoriesBox.get_vertical());
         this.categoriesBox.get_children()[0].add_actor(this.placesButton.actor);

         let bookmarks = this._listBookmarks();
         let devices = this._listDevices();
         let places = bookmarks.concat(devices);
         for(let i = 0; i < places.length; i++) {
            let place = places[i];
            let button = new PlaceButtonExtended(this, this.applicationsScrollBox, place, this.iconView,
                                                 this.iconAppSize, this.textButtonWidth, this.appButtonDescription);
            this._addEnterEvent(button, Lang.bind(this, function() {
               this._clearPrevAppSelection(button.actor);
               button.actor.style_class = "menu-application-button-selected";
               
               this.selectedAppBox.setSelectedText(button.app.get_name(), button.app.get_description());
               this.hover.refreshPlace(button.place);
            }));
            button.actor.connect('leave-event', Lang.bind(this, function() {
               this._previousSelectedActor = button.actor;
               button.actor.style_class = "menu-application-button";
               this.selectedAppBox.setSelectedText("", "");
               this.hover.refreshFace();
            }));
            this._placesButtons.push(button);
            if(this._applicationsBoxWidth > 0)
               button.container.set_width(this._applicationsBoxWidth);
         }
      }
      // Now generate recent category and recent files buttons and add to the list
      if(this.showRecent) {
         this.recentButton = new RecentCategoryButtonExtended(null, this.iconCatSize, this.showCategoriesIcons);
         this._addEnterEvent(this.recentButton, Lang.bind(this, function() {
            if(!this.searchActive) {
               this.recentButton.isHovered = true;
               if(this.hover_delay > 0) {
                  Tweener.addTween(this, {
                     time: this.hover_delay, onComplete: function () {
                        if(this.recentButton.isHovered) {
                           this._clearPrevCatSelection(this.recentButton.actor);
                           this.recentButton.actor.set_style_class_name('menu-category-button-selected');
                           this.recentButton.actor.add_style_class_name('menu-category-button-selected-' + this.theme);
                           this._displayButtons(null, null, -1);
                        }
                     }
                  });
               } else {
                  this._clearPrevCatSelection(this.recentButton.actor);
                  this.recentButton.actor.set_style_class_name('menu-category-button-selected');
                  this.recentButton.actor.add_style_class_name('menu-category-button-selected-' + this.theme);
                  this._displayButtons(null, null, -1);
               }
               this.makeVectorBox(this.recentButton.actor);
            }
         }));
         this.recentButton.actor.connect('leave-event', Lang.bind(this, function () {  
            if(this._previousTreeSelectedActor === null) {
               this._previousTreeSelectedActor = this.recentButton.actor;
            } else {
               let prevIdx = this.catBoxIter.getVisibleIndex(this._previousTreeSelectedActor);
               let nextIdx = this.catBoxIter.getVisibleIndex(this.recentButton.actor);
               let numVisible = this.catBoxIter.getNumVisibleChildren();
                    
               if(Math.abs(prevIdx - nextIdx) <= 1) {
                  this._previousTreeSelectedActor = this.recentButton.actor;
               }
            }
            this.recentButton.isHovered = false;
         }));

         this.categoriesBox.get_children()[0].add_actor(this.recentButton.actor);
         this.recentButton.setVertical(!this.categoriesBox.get_vertical());
         this._categoryButtons.push(this.recentButton);

         for(let id = 0; id < MAX_RECENT_FILES && id < this.RecentManager._infosByTimestamp.length; id++) {
            let button = new RecentButtonExtended(this, this.RecentManager._infosByTimestamp[id], this.iconView,
                                                  this.iconAppSize, this.textButtonWidth, this.appButtonDescription);
            this._addEnterEvent(button, Lang.bind(this, function() {
               this._clearPrevAppSelection(button.actor);
               button.actor.style_class = "menu-application-button-selected";
               this.selectedAppBox.setSelectedText(button.button_name, button.file.uri.slice(7));
               this.hover.refreshFile(button.file);
            }));
            button.actor.connect('leave-event', Lang.bind(this, function() {
               button.actor.style_class = "menu-application-button";
               this._previousSelectedActor = button.actor;
               this.selectedAppBox.setSelectedText("", "");
               this.hover.refreshFace();
            }));
            this._recentButtons.push(button);
            if(this._applicationsBoxWidth > 0)
               button.container.set_width(this._applicationsBoxWidth);
         }
         if(this.RecentManager._infosByTimestamp.length > 0) {
            let button = new RecentClearButtonExtended(this, this.iconView, this.iconAppSize, this.textButtonWidth, this.appButtonDescription);
            this._addEnterEvent(button, Lang.bind(this, function() {
               this._clearPrevAppSelection(button.actor);
               button.actor.style_class = "menu-application-button-selected";
               this.selectedAppBox.setSelectedText(button.button_name, "");
               this.hover.refresh("edit-clear");
            }));
            button.actor.connect('leave-event', Lang.bind(this, function() {
               button.actor.style_class = "menu-application-button";
               this._previousSelectedActor = button.actor;
               this.selectedAppBox.setSelectedText("", "");
               this.hover.refreshFace();
            }));
            this._recentButtons.push(button);
            if(this._applicationsBoxWidth > 0)
               button.container.set_width(this._applicationsBoxWidth);
         }
      }
      this._setCategoriesButtonActive(!this.searchActive);
   },

   _appLeaveEvent: function(a, b, applicationButton) {
      this._previousSelectedActor = applicationButton.actor;
      applicationButton.actor.style_class = "menu-application-button";
      this.selectedAppBox.setSelectedText("", "");
      this.hover.refreshFace();
   },

   _appEnterEvent: function(applicationButton) {
      if(applicationButton.app.get_description())
         this.selectedAppBox.setSelectedText(applicationButton.app.get_name(), applicationButton.app.get_description());
      else
         this.selectedAppBox.setSelectedText(applicationButton.app.get_name(), "");
      this._previousVisibleIndex = this.appBoxIter.getVisibleIndex(applicationButton.actor);
      this._clearPrevAppSelection(applicationButton.actor);
      applicationButton.actor.style_class = "menu-application-button-selected";
      this.hover.refreshApp(applicationButton.app);
   },

   _addEnterEvent: function(button, callback) {
      let _callback = Lang.bind(this, function() {
         try {
            let parent = button.actor.get_parent();
            if((parent)&&(parent != this.categoriesBox))
               parent = parent.get_parent();
            if(this._activeContainer !== this.applicationsBox && parent !== this._activeContainer) {
               this._previousTreeItemIndex = this._selectedItemIndex;
               this._previousTreeSelectedActor = this._activeActor;
               this._previousSelectedActor = null;
            }
            if(this._previousTreeSelectedActor && this._activeContainer !== this.categoriesBox &&
               parent !== this._activeContainer && button !== this._previousTreeSelectedActor) {
               this._previousTreeSelectedActor.set_style_class_name('menu-category-button');
               this._previousTreeSelectedActor.add_style_class_name('menu-category-button-' + this.theme);
            }
            if((parent)&&(parent != this._activeContainer)) {
                parent._vis_iter.reloadVisible();
            }
            let _maybePreviousActor = this._activeActor;
            if(_maybePreviousActor && this._activeContainer === this.applicationsBox) {
               this._previousSelectedActor = _maybePreviousActor;
               this._clearPrevAppSelection();
            }
            if(parent === this.categoriesBox && !this.searchActive) {
               this._previousSelectedActor = _maybePreviousActor;
               this._clearPrevCatSelection();
            }
            this._activeContainer = parent;
            this._activeActor = button.actor;
            if(this._activeContainer) {
               this._selectedItemIndex = this._activeContainer._vis_iter.getAbsoluteIndexOfChild(this._activeActor);
               this._selectedRowIndex = this._activeContainer._vis_iter.getInternalIndexOfChild(this._activeActor);
            }
            callback();
         } catch(e) {
            Main.notify("error3", e.message);
         }
      });
      button.connect('enter-event', _callback);
      button.actor.connect('enter-event', _callback);
   },

   _loadCategory: function(dir, top_dir) {
      var iter = dir.iter();
      var has_entries = false;
      var nextType;
      if(!top_dir) top_dir = dir;
      while((nextType = iter.next()) != GMenu.TreeItemType.INVALID) {
         if(nextType == GMenu.TreeItemType.ENTRY) {
            var entry = iter.get_entry();
            if(!entry.get_app_info().get_nodisplay()) {
               has_entries = true;
               var app = appsys.lookup_app_by_tree_entry(entry);
               if(!app)
                  app = appsys.lookup_settings_app_by_tree_entry(entry);
               var app_key = app.get_id()
               if(app_key == null) {
                  app_key = app.get_name() + ":" + 
                  app.get_description();
               }
               if(!(app_key in this._applicationsButtonFromApp)) {
                  let applicationButton = new ApplicationButtonExtended(this, this.applicationsScrollBox, app, this.iconView, this.iconAppSize,
                                                                        this.iconMaxFavSize, this.textButtonWidth, this.appButtonDescription);
                  this._applicationsButtons.push(applicationButton);
                  applicationButton.actor.connect('realize', Lang.bind(this, this._onApplicationButtonRealized));
                  applicationButton.actor.connect('leave-event', Lang.bind(this, this._appLeaveEvent, applicationButton));
                  this._addEnterEvent(applicationButton, Lang.bind(this, this._appEnterEvent, applicationButton));
                  applicationButton.category.push(top_dir.get_menu_id());
                  this._applicationsButtonFromApp[app_key] = applicationButton;
               } else {
                  this._applicationsButtonFromApp[app_key].category.push(dir.get_menu_id());
               }
            }
         } else if (nextType == GMenu.TreeItemType.DIRECTORY) {
            let subdir = iter.get_directory();
            if(this._loadCategory(subdir, top_dir)) {
               has_entries = true;
            }
         }
      }
      return has_entries;
   },

   _initialDisplay: function() {
      if(!this.displayed) {
         this.initButtonLoad = 30;
         let n = Math.min(this._applicationsButtons.length, this.initButtonLoad);
         for(let i = 0; i < n; i++) {
            if(!this._applicationsButtons[i].actor.visible)
               this._applicationsButtons[i].actor.show();
         }
         Mainloop.idle_add(Lang.bind(this, this._initial_cat_selection));
         this.displayed = true;
         if(!this.fullScreen) {
            let monitor = Main.layoutManager.findMonitorForActor(this.actor);
            let maxHeigth = monitor.height - this._processPanelSize(true) - this._processPanelSize(false);
            if(this.height > maxHeigth)
               this.height = maxHeigth;
            if(this.width > monitor.width)
               this.width = monitor.width;
            this.mainBox.set_width(this.width);
            this.mainBox.set_height(this.height);
            if(this.updateTheme) {
               this.updateTheme = false;
               Mainloop.idle_add(Lang.bind(this, this._updateSize()));
            }
         } else {
            this._setFullScreen();
         }
      }
   },

   _onOpenStateChanged: function(menu, open) {
      if(open) {
         this.menuIsOpening = true;
         this.actor.add_style_pseudo_class('active');
         global.stage.set_key_focus(this.searchEntry);
         this._selectedItemIndex = null;
         this._activeContainer = null;
         this._activeActor = null;
         this._initialDisplay();
         this._allAppsCategoryButton.actor.set_style_class_name('menu-category-selected');
         this._allAppsCategoryButton.actor.add_style_class_name('menu-category-button-selected-' + this.theme);
         this.selectedAppBox.setDateTimeVisible(this.showTimeDate);
      }
      else {
         if(this.bttChanger) 
            this.bttChanger.activateSelected(_("All Applications"));
         this._disableResize();
         this.actor.remove_style_pseudo_class('active');
         if(this.searchActive) {
            this.resetSearch();
         }
         this.selectedAppBox.setSelectedText("", "");
         this.hover.refreshFace();
         this.hover.closeMenu();
         this._previousTreeItemIndex = null;
         this._previousTreeSelectedActor = null;
         this._previousSelectedActor = null;
         this.closeApplicationsContextMenus(null, false);
         this._clearAllSelections(false);
         this._refreshFavs();
         if(this.accessibleBox)
            this.accessibleBox.refreshAccessibleItems();
         if(this.gnoMenuBox)
            this.gnoMenuBox.setSelected(_("Favorites"));
         this.destroyVectorBox();
         this.powerBox.disableSelected();
         this.selectedAppBox.setDateTimeVisible(false);
      }
   }
};

function main(metadata, orientation, panel_height, instance_id) {  
    let myApplet = new MyApplet(metadata, orientation, panel_height, instance_id);
    return myApplet;      
}  
