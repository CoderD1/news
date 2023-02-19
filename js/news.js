/* 
  Manage url links
  - read url links and populate to tabbed pages
  - change background without reloading the web page
  - use cookies to keep track current tab, background color and image
  - many JS shorthands
 
 coderd1 - Nov-2022
*/


const fill = (t, e = "") => {
      const i = (t.match(/\-/g) || []).length;
      return e ? `<p><a href='https://${t}'> ${e} </a></p>` :
               "<br/>".repeat(i)
   },

   element = t => document.getElementById(t),

   info = t => {
      let e = new Date,
         i = e.toLocaleString("default", {
            weekday: "long"
         }),
         s = 1900 + e.getYear(),
         n = e.getDate(),
         a = 1 + e.getMonth();

      const c = [e.getHours(), e.getMinutes(), e.getSeconds()]
                  .map((t => t < 10 ? "0" + t : t)).join(":"),
         o = location.host,
         l = element(t);

      l ? l.innerHTML = `${o} ☼ ${i} ${a}/${n}/${s} ☼ ${c}` :
          (clearInterval(c_interval), c_interval = void 0)
   },
   
   to_array = t => t ?
            (typeof t).match(/object/) ? t :
                t.split(/\r?\n/).map((t => t.trim())).filter((t => "" !== t))
            : [""], 

   page = t => {
      $._page(t)
   },

   get_cookie = (t, e) => {
      let i = new RegExp(t + "=([0-9]+)");
      try {
         return document.cookie.match(i)[1] % e
      } catch (t) {
         return 0
      }
   },

   $ = {
      bg: {
         list: [],
         style: 0,
         current: -1,
         caption: element("bg-caption"),
         switch: element("bg-switch"),
         style_switch: element("bg-style-switch")
      },
      tab: {
         count: 0,
         last: "tabx",
         tags: Object.values(document
                     .querySelectorAll("[id^='tab']"))
                     .map((t => t.id))
      },
      page: {
         info: [],
         id: element("page"),
         error: element("error")
      },
      left: "↫",
      right: "↬",
      links: "",
      cookie: !0,

      init: function () {
         !(typeof backgrounds).match(/undefined/) && Array.isArray(backgrounds) && 
           (this.bg.list = backgrounds),
         0 == this.bg.list.length && (this.bg.switch.hidden = this.bg.style_switch.hidden = !0),
         1 == this.bg.list.length && (this.bg.style_switch.hidden = !0),
         this.tab.count = this.tab.tags.length - 1,
         this.change_background_style(!1),
         "" !== this.links ? this.populate(this.links) : this.fetch(".data")
      },

      // read file .data instead of 'this.links'
      fetch: function (t) {
         fetch(t).then((t => {
            200 === t.status ? t.text().then((t => {
               this.populate(t)
            })) : this.error("reading data file")
         })).catch((t => {
            this.error(t)
         }))
      },

      populate: function (t) {
         const e = {

            // lines with # ; are ignored.
            // lines with - or -- becomes empty line(s)
            // sample links:
            //
            // [section 1a]
            //   cnn.com      | CNN
            //   apnews.com   | AP

            comment: /^\s*[;#].*$/,
            section: /^\s*\[\s*([^\]]*)\s*\]\s*$/,
            link: /^\s*([^\|]+?)\s*\|\s*(.*?)\s*$/,
            empty: /^-.*$/
         };

         let i, s = {}, n = null;
         t.split(/\r?\n/).map(item => item.trim()).forEach(t => {
             t && ! e.comment.test(t) && (
                 e.section.test(t) ?
                     (
                       i = t.match(e.section),
                       n = i[1], s[n] = ''
                     ) : e.link.test(t) ?
                         (
                           i = t.match(e.link).map(item => item.trim()),
                           n && (s[n] += fill(i[1], i[2]))
                         ) : e.empty.test(t) &&
                             (
                               i = t.match(e.empty),
                               n && (s[n] += fill(i[0]))
                             )
             )
         })

         let a = Object.values(s);
         if (!a.length) return void this.error("no news links in data");
         a.length < 2 * this.tab.count && (
            a = [...a, ...Array(2 * this.tab.count - a.length)]
         );
         [...Array(this.tab.count).keys()].forEach(t => {
            this.page.info[t] = `
            <div class='content'>
              <div class='left column'> ${a[2*t]} </div>
              <div class='right column'> ${a[2*t+1]} </div>
            </div>
            `
         }),
         this._page()
      },

      _page: function (t = -1) {
         -1 === t && (t = this.cookie ? get_cookie("tab", this.tab.count) : 0);
         const e = "tab" + t;
         this.tab.tags.includes(e) && e !== this.tab.last && (
           this.page.info[t] && (this.page.id.innerHTML = this.page.info[t]),
           this.tab.tags.includes(this.tab.last) && (element(this.tab.last).className = ""),
           element(e).className = "active", this.tab.last = e,
           this.cookie && (document.cookie = `tab=${t}`))
      },

      change_background_style: function (t = !0) {
        this.cookie && (this.bg.style = get_cookie("bg-style", this.bg.list.length)), 
        t && (this.bg.style = ++this.bg.style % this.bg.list.length), 
        this.cookie && (document.cookie = `bg-style=${this.bg.style}`),
        this.bg.style_switch.innerHTML = this.bg.style ? this.left : this.right,
        this.change_background()
      },

      change_background: function () {
         const t = (this.bg.list[this.bg.style] || "").trim().split(/\r?\n/);
         this.cookie && (this.bg.current = get_cookie("bg", t.length)),
         this.bg.current = ++this.bg.current % t.length,
         this.cookie && (document.cookie = `bg=${this.bg.current}`);
         
         const e = t[this.bg.current].split(/\|/).map((t => t.trim())),
            i = e[0] || "lightblue";
         this.bg.caption.innerHTML = i,
         // change css background color var for tab header, page and caption
         document.documentElement.style.setProperty("--bg-color", i);
         
         const s = e[1] || "";
         1 == e.length && (this.page.id.style.backgroundImage = ""),
         2 == e.length && (this.page.id.style.backgroundImage = `url(${s})`)
      },

      error: function (t) {
         this.page.error.innerHTML = `<span class='error'>Error -> ${t}</span>`
      }
   };

let c_interval;
void 0 === c_interval && (c_interval = setInterval(info, 1e3, "info"));
