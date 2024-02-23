 /* 
  Manage url links
  - read url links and populate to tabbed pages
  - change background without reloading the web page
  - use cookies to keep track current tab, background color and image
  - many JS shorthands
 
 coderd1 - Nov-2022 : initial revision
           Dec 2023 : use js class
*/
    //
    const rev = '—2P10M2247—'

    class Page {
        'use strict'

        constructor(params={}) {
             // singleton
            if (Page._instance) throw new Error('Page can only be instantiated once!')
            Page._instance = this

            const 
              opts = {
                   links:       undefined,
                   backgrounds: undefined,
                   info:        document.querySelector('#info'),
                   host:        location.host,
                   left:        '&#8619;',
                   right:       '&#8620;',
                   cookie:      true,      // for tab only
                  }

            this.opt = Object.assign(opts, params)

            this.bg = {
                   style:        0, // index of opt.backgrounds (0 or 1)
                   list:         [],
                   caption:      document.querySelector('#bg-caption'),
                   switch:       document.querySelector('#bg-switch'),
                   style_switch: document.querySelector('#bg-style-switch'),
                  }

            this.tab = {
                   id:    0,
                   count: 0,
                   last:  'tabx',
                   tags:  Object.values(document.querySelectorAll("[id^='tab']"))
                                .map(item=>item.id),
                  }

            this.page = {
                   info:  [],
                   id:    document.querySelector('#page'),
                   error: document.querySelector('#error'),
                  }

           // setInterval has own 'this'. Use bind if needing to pass in 'this'
           // or use big arrow 
           this.clock(this.opt.info, this.opt.host)
           setInterval(this.clock, 1000, this.opt.info, this.opt.host)
           this.starting()

        } // constructor

    
       starting() {

           // background list, max len = 2
           !(typeof this.opt.backgrounds).match(/undefined/) &&
                         Array.isArray(this.opt.backgrounds) &&
                         (this.bg.list = this.opt.backgrounds)

           0 == this.bg.list.length &&
                         (this.bg.switch.hidden = this.bg.style_switch.hidden = true)
           1 == this.bg.list.length &&
                         (this.bg.style_switch.hidden = true) 

           this.tab.count = this.tab.tags.length - 1
           this.change_background_style(false)

           // populate tabs with data links, either from variable or fetching from file
           !(typeof this.opt.links).match(/undefined/) || this.opt.links !== '' ?
               this.populate(this.opt.links) : fetch('.data')

            this.switch_page()

           // ** Event Listeners - click on icons
            this.bg.switch.addEventListener('click', () => this.change_background()) 
            this.bg.style_switch.addEventListener('click', () => this.change_background_style())

           // fast keys
            window.addEventListener('keyup', (event) => {
                switch(event.keyCode) {
                    case 13:  this.change_background(); break;        // Enter
                    case 113: this.change_background_style(); break;  // F2
                    case 19:
                    case 37:  this.switch_page(this.tab.id - 1); break;     // Pause or <-
                    case 45:
                    case 39:  this.switch_page(this.tab.id + 1); break;     // Insert or ->
                }
            })

            // mouseover the tab
            ;[...Array(this.tab.count).keys()].forEach(id => {
                 document.querySelector('#tab'+id)
                    .addEventListener('mouseover', () => this.switch_page(id))
            })

        }// starting

        clock(info, host) {
            const
              date    = new Date(),
              weekday = date.toLocaleString('default', { weekday: 'long' }),
              year    = 1900 + date.getYear(),
              day     = date.getDate(),
              month   = 1 + date.getMonth(),
              time    = [date.getHours(), date.getMinutes(), date.getSeconds()].
                             map(item => item < 10 ? '0' + item : item).join(':')

             info.innerHTML = `${host} &#x263C;\
                    ${weekday} ${month}/${day}/${year} &#x263C; ${time}` 
        }

        fill(item1, item2 = '') {
              // two items: show href link
              // one item: showing empty lines depends on '-' count
      
              const count = (item1.match(/\-/g) || []).length
              return item2 ? `<p><a href='https://${item1}'>&nbsp;${item2}&nbsp;</a></p>` 
                           : '<br>'.repeat(count)
        }
    
        get_cookie(flag, max) {
            let regex = new RegExp(flag + '=([0-9]+)')
            try {
                return document.cookie.match(regex)[1] % max
            } catch (error) { return 0 }
        }
  
        fetch(file) {
            fetch(file).then(response => {
                200 === response.status ?
                    response.text().then(data => {
                        this.populate(data)
                    }) : this.error('reading data file')

            }).catch(error => {
                this.error(error)
            })
        }

        populate(data) {
            // populating the data/links
            const regex = {
                           comment:  /^\s*[;#].*$/,
                           section:  /^\s*\[\s*([^\]]*)\s*\]\s*$/,
                           link:     /^\s*([^\|]+?)\s*\|\s*(.*?)\s*$/,
                           empty:    /^-.*$/,
                          }
            let match, sections = {}, section = null;
            data.split(/\r?\n/).map(item => item.trim()).forEach(line => {
                if (!line || regex.comment.test(line)) return
                // shorthand of if and else ifs
                regex.section.test(line) ?
                    (
                      match = line.match(regex.section),
                      section = match[1], sections[section] = ''
                    ) : regex.link.test(line) ?
                        (
                          match = line.match(regex.link).map(item => item.trim()),
                          section && (sections[section] += this.fill(match[1], match[2]))
                        ) : regex.empty.test(line) &&
                            (
                              match = line.match(regex.empty),
                              section && (sections[section] += this.fill(match[0]))
                            )
            })


            let block = Object.values(sections)
            if (!block.length) return void error('no news links in data')
            block.length < 2 * this.tab.count &&  // fill empty pages
                (block = [...block, ...Array(2 * tab.count - block.length)])

            ;[...Array(this.tab.count).keys()].forEach(number => {

                // vertical revision on last page
                const vertical = number == this.tab.count - 1 ? `<span id='rev'>${rev}</span>` : ''

                this.page.info[number] = ` 
                  <div class='content'>
                    <div class='left column'> ${block[2 * number]} </div>
                    <div class='right column'> ${block[2 * number + 1]} </div>
                  </div>
                  ${vertical}
                 `
            })
        }

        switch_page (id='') {
            id.length === 0 && // empty
                (id = this.opt.cookie ? this.get_cookie('tab', this.tab.count) : 0)

            id < 0 && (id = this.tab.count - 1)   // out of bound to the left
            id > this.tab.count -1 && (id = 0)    // out of bound to the right

            const ctab = 'tab' + id
            this.tab.tags.includes(ctab) && ctab !== this.tab.last &&
                (
                  this.page.info[id] && (this.page.id.innerHTML = this.page.info[id]),
                  this.tab.tags.includes(this.tab.last) &&
                      (document.querySelector('#'+this.tab.last).className = ''),
                  document.querySelector('#'+ctab).className = 'active',
                  this.tab.last = ctab,
                  this.tab.id = id,
                  this.opt.cookie && (document.cookie = `tab=${id}`)
                )
        }

        change_background_style(click=true) {
            click && (this.bg.style = Math.floor(Math.random() * this.bg.list.length))
            this.bg.style_switch.innerHTML = this.bg.style ? this.opt.left : this.opt.right
            this.change_background()
        }

        change_background() {
            // change background color or image randomly from the bg.list
            const
              background = this.bg.list[this.bg.style] || '',
              lines = background.trim().split(/\r?\n/),
              rand  = Math.floor(Math.random() * lines.length),
              part  = lines[rand].split(/\|/).map(item => item.trim()),
              color = part[0] || 'lightblue'

            this.bg.caption.innerHTML = color

            // change color var for tab, page and caption
            document.documentElement.style.setProperty('--bg-color', color)

            const image = part[1] || ''
            1 == part.length && (this.page.id.style.backgroundImage = '') 
            2 == part.length && (this.page.id.style.backgroundImage = `url(${image})`)
        }
  
        error(message) {
             page.error.innerHTML = `<span class='error'>Error -> ${message}</span>`
        }

    };
