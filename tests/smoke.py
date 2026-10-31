#!/usr/bin/env python3
"""Browser regression checks for Habibti. Start the static server before running.

    python3 tests/smoke.py --url http://127.0.0.1:8000

Requires Playwright for Python and Chromium. External requests are blocked; the
YouTube control protocol is tested with a local response fixture, not streaming.
Artifacts and a machine-readable report are written under tests/artifacts/.
"""
import argparse
import datetime as dt
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import io
import json
import math
from pathlib import Path
import struct
import sys
import threading
import time
import wave
import zlib
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright, expect


def png_image(width=32, height=24):
    def chunk(name, data):
        return struct.pack('!I', len(data)) + name + data + struct.pack('!I', zlib.crc32(name + data) & 0xffffffff)
    pixels = b''.join(b'\x00' + bytes((241, 139, 135)) * width for _ in range(height))
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('!2I5B', width, height, 8, 2, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(pixels)) + chunk(b'IEND', b'')


def wav_audio():
    output = io.BytesIO()
    with wave.open(output, 'wb') as audio:
        audio.setnchannels(1)
        audio.setsampwidth(2)
        audio.setframerate(8000)
        audio.writeframes(b''.join(struct.pack('<h', int(1000 * math.sin(2 * math.pi * 220 * i / 8000))) for i in range(32000)))
    return output.getvalue()


MOCK_YOUTUBE = """<!doctype html><html><body>Test player fixture<script>
let current=0,state=2,volume=60;
function deliver(){parent.postMessage(JSON.stringify({event:'infoDelivery',info:{playerState:state,duration:180,currentTime:current,volume}}),'*')}
addEventListener('message',e=>{let m;try{m=JSON.parse(e.data)}catch{return}
if(m.event==='listening')deliver();if(m.event!=='command')return;
if(m.func==='playVideo')state=1;if(m.func==='pauseVideo')state=2;
if(m.func==='seekTo')current=m.args[0];if(m.func==='setVolume')volume=m.args[0];deliver();});
</script></body></html>"""


def main():
    args = argparse.ArgumentParser()
    args.add_argument('--url', default='http://127.0.0.1:8000')
    args.add_argument('--chromium', default='/usr/bin/chromium')
    args.add_argument('--artifacts', type=Path, default=Path(__file__).resolve().parent / 'artifacts')
    options = args.parse_args()
    options.artifacts.mkdir(parents=True, exist_ok=True)
    report = {'started_at': dt.datetime.now(dt.timezone.utc).isoformat(), 'url': options.url,
              'passed': [], 'failed': [], 'skipped': [], 'external_requests_blocked': [],
              'limitations': ['YouTube streaming is excluded; controls are exercised using a simulated iframe player.']}
    page_errors, bad_responses = [], []
    expected_data = {}

    def check(name, action):
        try:
            action()
            report['passed'].append(name)
            print('PASS ' + name, flush=True)
            return True
        except Exception as error:
            report['failed'].append({'name': name, 'error': str(error)})
            print('FAIL ' + name + ': ' + str(error), flush=True)
            # Recover visible modal UI so an isolated failure does not make the
            # remaining independent checks fail against an inert application.
            try:
                page.keyboard.press('Escape')
                page.locator('dialog[open]').evaluate_all('(nodes)=>nodes.forEach(n=>n.close())')
            except Exception:
                pass
            return False

    def require(condition, message):
        if not condition:
            raise AssertionError(message)

    def route_external(route):
        url = route.request.url
        if urlparse(url).hostname in ('127.0.0.1', 'localhost') or url.startswith(('data:', 'blob:', 'about:')):
            route.continue_()
        elif url.startswith('https://www.youtube-nocookie.com/embed/'):
            route.fulfill(status=200, content_type='text/html', body=MOCK_YOUTUBE)
        else:
            report['external_requests_blocked'].append(url)
            route.abort()

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(executable_path=options.chromium, headless=True)

        def new_context(**kwargs):
            context = browser.new_context(reduced_motion='reduce', accept_downloads=True, timezone_id='Asia/Dubai', **kwargs)
            context.route('**/*', route_external)
            context.on('page', lambda page: page.on('pageerror', lambda error: page_errors.append(str(error))))
            context.on('response', lambda response: bad_responses.append({'url': response.url, 'status': response.status}) if response.status >= 400 and urlparse(response.url).hostname in ('localhost', '127.0.0.1') else None)
            return context

        context = new_context(viewport={'width': 1440, 'height': 900})
        page = context.new_page()
        page.set_default_timeout(7000)

        def login(target=page):
            if target.locator('body').get_attribute('data-scene') == 'welcome':
                target.locator('#beginJourney').click()
            for index, digit in enumerate('262'):
                target.locator('.secret-digit').nth(index).fill(digit)
            target.locator('#openGiftBtn').click()
            expect(target.locator('body')).to_have_attribute('data-scene', 'world')
            expect(target.locator('#galaxyExperience')).to_have_class('galaxy-experience unlocked')

        def welcome_login():
            page.goto(options.url, wait_until='networkidle')
            expect(page.locator('#welcomeTitle')).to_have_text('حبيبتي')
            expect(page.locator('#beginJourney')).to_be_visible()
            expect(page.locator('#ytIframe')).to_have_attribute('src', 'about:blank')
            page.screenshot(path=str(options.artifacts / 'welcome-1440.png'))
            page.locator('#beginJourney').click()
            expect(page.locator('.secret-digit').first).to_be_focused()
            for index, digit in enumerate('111'):
                page.locator('.secret-digit').nth(index).fill(digit)
            page.locator('#openGiftBtn').click()
            expect(page.locator('#vaultLoginForm')).to_have_class('wrong-code')
            expect(page.locator('#vaultFeedback')).not_to_have_text('هنا تبدأ حكايتنا ♡')
            require(page.locator('body').get_attribute('data-scene') == 'login', 'Wrong code opened the world')
            page.screenshot(path=str(options.artifacts / 'login-1440.png'))
            page.locator('#backToWelcome').click()
            expect(page.locator('#beginJourney')).to_be_focused()
            login()
            expect(page.locator('#ytIframe')).to_have_attribute('src', 'about:blank')
            page.screenshot(path=str(options.artifacts / 'home-1440.png'))

        check('Welcome, wrong secret, back navigation, correct 262 and no autoplay', welcome_login)

        def navigation():
            all_links = page.locator('a[href^="#"]').evaluate_all('(links)=>links.map(l=>l.getAttribute("href"))')
            missing = page.evaluate('(links)=>links.filter(h=>!document.querySelector(h))', all_links)
            require(not missing, 'Missing anchor targets: ' + repr(missing))
            page.locator('#openSideMenu').click()
            expect(page.locator('#closeSideMenu')).to_be_focused()
            expect(page.locator('#cinemaSidebar')).to_have_attribute('aria-hidden', 'false')
            page.keyboard.press('Shift+Tab')
            expect(page.locator('.sidebar-link').last).to_be_focused()
            page.keyboard.press('Tab')
            expect(page.locator('#closeSideMenu')).to_be_focused()
            page.keyboard.press('Escape')
            expect(page.locator('#openSideMenu')).to_be_focused()
            expect(page.locator('#cinemaSidebar')).to_have_attribute('aria-hidden', 'true')
            links = page.locator('.sidebar-link').evaluate_all('(nodes)=>nodes.map(n=>n.getAttribute("href"))')
            for href in links:
                page.locator('#openSideMenu').click()
                page.locator('.sidebar-link[href="' + href + '"]').click()
                expect(page.locator('#cinemaSidebar')).to_have_attribute('aria-hidden', 'true')
                require(page.evaluate('location.hash') == href, 'Sidebar link failed: ' + href)
            for href in page.locator('.cinema-nav-item').evaluate_all('(nodes)=>nodes.map(n=>n.getAttribute("href"))'):
                page.locator('.cinema-nav-item[href="' + href + '"]').click()
                require(page.evaluate('location.hash') == href, 'Top navigation failed: ' + href)

        check('All anchor targets, top navigation, sidebar links and keyboard focus trap', navigation)

        def stars_book():
            for i in range(5):
                star = page.locator(f'.star-hotspot[data-star="{i}"]')
                star.scroll_into_view_if_needed()
                star.focus()
                page.keyboard.press('Enter')
                expect(star).to_have_class('star-hotspot discovered')
                expect(page.locator('#starBadgeNum')).to_contain_text(f'STAR 0{i + 1}')
            expect(page.locator('#starsCounterText')).to_have_text('أضأتي 5 من 5 نجوم ✦')
            expect(page.locator('#cLine5')).to_have_class('heart-constellation-line lit')
            page.locator('#chapter-stars').screenshot(path=str(options.artifacts / 'stars-1440.png'))
            titles = []
            for index in range(4):
                page.locator(f'.page-dot[data-page="{index}"]').click()
                expect(page.locator('#bookPageIndicator')).to_contain_text(['١', '٢', '٣', '٤'][index])
                titles.append(page.locator('#bookPageTitle').inner_text())
                page.locator('#toggleMarginNoteBtn').click()
                expect(page.locator('#marginSecretBox')).to_be_visible()
                require(bool(page.locator('#marginSecretBox').inner_text()), 'Empty secret margin')
            require(len(set(titles)) == 4, 'Book pages did not change')
            page.locator('#nextPageBtn').click()
            expect(page.locator('.page-dot[data-page="0"]')).to_have_class('page-dot active')
            page.locator('#prevPageBtn').click()
            expect(page.locator('.page-dot[data-page="3"]')).to_have_class('page-dot active')
            page.locator('#chapter-book').screenshot(path=str(options.artifacts / 'book-1440.png'))

        check('Five keyboard-accessible stars, complete heart, four book pages and secret notes', stars_book)

        def games_and_potions():
            prescriptions = []
            for potion in page.locator('[data-potion]').all():
                potion.click()
                prescriptions.append(page.locator('#rxCode').inner_text())
            require(len(set(prescriptions)) == 4, 'Potion selection did not change prescriptions')
            page.locator('#dispenseRxBtn').click()
            questions = []
            for _ in range(3):
                questions.append(page.locator('#quizQuestionText').inner_text())
                page.locator('.quiz-opt-btn').first.click()
                expect(page.locator('#quizReplyBox')).to_be_visible()
                page.locator('#nextQuizBtn').click()
            require(len(set(questions)) == 3, 'Quiz did not cycle all three questions')
            runaway = page.locator('#runawayBtn')
            runaway.scroll_into_view_if_needed()
            before = runaway.get_attribute('style')
            runaway.dispatch_event('pointerenter')
            after = runaway.get_attribute('style')
            require(before != after, 'Runaway button did not move')
            page.locator('#approveForeverBtn').click()
            expect(page.locator('#vipDecreePass')).to_be_visible()
            expect(runaway).to_be_hidden()

        check('Four emotion prescriptions, three quiz questions, runaway button and agreement', games_and_potions)

        def extras():
            page.locator('#spinAffectionWheel').click()
            expect(page.locator('#spinAffectionWheel')).to_be_enabled()
            expect(page.locator('#affectionWheelResult')).not_to_have_text('يا ترى وش بتقول لكِ؟ 🤍')
            require(bool(page.locator('#affectionWheelDisc').get_attribute('style')), 'Wheel did not rotate')
            # Solve through the same tile buttons used by the visitor, never mutating app state.
            for position in range(9):
                pieces = page.locator('#lovePuzzleBoard button').evaluate_all('(nodes)=>nodes.map(n=>Number(n.dataset.piece))')
                if pieces[position] != position:
                    other = pieces.index(position)
                    page.locator(f'#lovePuzzleBoard button[data-position="{position}"]').click()
                    page.locator(f'#lovePuzzleBoard button[data-position="{other}"]').click()
            expect(page.locator('#lovePuzzleResult')).to_contain_text('اكتمل البازل')
            page.locator('#shuffleLovePuzzle').click()
            pieces = page.locator('#lovePuzzleBoard button').evaluate_all('(nodes)=>nodes.map(n=>Number(n.dataset.piece))')
            require(pieces != list(range(9)), 'Shuffle left a solved puzzle')
            for button in page.locator('[data-coupon]').all():
                button.click()
                expect(button).to_have_attribute('aria-pressed', 'true')
            page.locator('#couponMovieBtn').click()
            expect(page.locator('#couponMovieBtn')).to_have_attribute('aria-pressed', 'false')
            page.locator('#plantGardenFlower').click()
            expect(page.locator('.little-garden-flower')).to_have_count(1)
            page.locator('#clearLittleGarden').click()
            expect(page.locator('.little-garden-flower')).to_have_count(0)
            page.locator('#plantGardenFlower').click()
            page.locator('#dailyEnvelopeBtn').click()
            expect(page.locator('#dailyEnvelopeMessage')).to_be_visible()
            for mood in page.locator('[data-gift-mood]').all():
                mood.click()
                expect(mood).to_have_attribute('aria-pressed', 'true')
                expect(page.locator('#moodGiftMessage')).to_be_visible()
            page.locator('[data-date-idea="dinner"]').click()
            future = page.evaluate('''() => {const d=new Date(Date.now()+86400000);const p=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`}''')
            page.locator('#dateGiftWhen').fill(future)
            page.locator('#dateGiftForm button[type=submit]').click()
            expect(page.locator('#dateGiftCountdown')).to_be_visible()
            expect(page.locator('#dateGiftStatus')).to_contain_text('محفوظ على هذا الجهاز')

        check('Wheel, complete puzzle, shuffle, coupons, garden, daily message, moods and date countdown', extras)

        def personal_uploads():
            page.locator('#gift-customize').evaluate('(node)=>node.open=true')
            image = {'name': 'memory.png', 'mimeType': 'image/png', 'buffer': png_image()}
            page.locator('#giftMemoryFiles').set_input_files(image)
            expect(page.locator('#giftMemoryEditor input')).to_have_count(1)
            page.locator('#giftCaption0').fill('صورة الاختبار <safe>')
            page.locator('#giftCaption0').press('Tab')
            expect(page.locator('#memoryGiftGallery figcaption')).to_have_text('صورة الاختبار <safe>')
            expect(page.locator('#albumFeaturedImage')).to_have_attribute('alt', 'صورة الاختبار <safe>')
            page.locator('#albumFeatured').click()
            expect(page.locator('#giftMemoryDialog')).to_be_visible()
            page.locator('#giftMemoryDialog button').click()
            audio = {'name': 'message.wav', 'mimeType': 'audio/wav', 'buffer': wav_audio()}
            page.locator('#giftVoiceFile').set_input_files(audio)
            expect(page.locator('#playVoiceGift')).to_be_enabled()
            page.wait_for_function('document.querySelector("#personalVoiceAudio").readyState >= 2')
            page.locator('#playVoiceGift').click()
            page.wait_for_function('!document.querySelector("#personalVoiceAudio").paused')
            page.locator('#playVoiceGift').click()
            page.wait_for_function('document.querySelector("#personalVoiceAudio").paused')
            page.locator('#giftPuzzleFile').set_input_files(image)
            expect(page.locator('#removeGiftPuzzle')).to_be_visible()
            expect(page.locator('#lovePuzzleBoard .has-photo')).to_have_count(9)
            page.locator('#removeGiftPuzzle').click()
            expect(page.locator('#removeGiftPuzzle')).to_be_hidden()
            page.locator('#giftReasonsInput').fill('سبب شخصي أول <safe>\nسبب شخصي ثانٍ')
            page.locator('#saveGiftReasons').click()
            page.locator('#nextLoveReasonBtn').click()
            expect(page.locator('#loveReasonText')).to_have_text('سبب شخصي أول <safe>')
            page.locator('#nextLoveReasonBtn').click()
            expect(page.locator('#loveReasonText')).to_have_text('سبب شخصي ثانٍ')
            before = page.evaluate('JSON.stringify(GiftExtras.data.memories)')
            page.locator('#giftMemoryFiles').set_input_files({'name': 'bad.txt', 'mimeType': 'text/plain', 'buffer': b'not an image'})
            expect(page.locator('#giftCustomizeStatus')).to_contain_text('JPEG')
            require(page.evaluate('JSON.stringify(GiftExtras.data.memories)') == before, 'Invalid image modified gallery data')
            page.locator('#giftVoiceFile').set_input_files({'name': 'bad.txt', 'mimeType': 'text/plain', 'buffer': b'not audio'})
            expect(page.locator('#giftCustomizeStatus')).to_contain_text('صوتي')
            before = page.evaluate('JSON.stringify(GiftExtras.data.memories)')
            page.locator('#giftMemoryFiles').set_input_files({'name': 'corrupt.png', 'mimeType': 'image/png', 'buffer': b'not a valid PNG'})
            expect(page.locator('#giftCustomizeStatus')).to_contain_text('ما قدرنا نفتح الصورة')
            require(page.evaluate('JSON.stringify(GiftExtras.data.memories)') == before, 'Corrupt image modified gallery data')
            expect(page.locator('#downloadPersonalGift')).to_be_enabled()

        check('Real PNG and WAV uploads, captions, album lightbox, audio play/pause, photo puzzle, custom reasons and invalid files', personal_uploads)

        def editable_sections():
            image = {'name': 'timeline.png', 'mimeType': 'image/png', 'buffer': png_image()}
            page.locator('#newMemoryTitle').fill('ذكرى الاختبار')
            page.locator('#newMemoryDate').fill('2026-10-30')
            page.locator('#newMemoryDescription').fill('وصف آمن <test>')
            page.locator('#newMemoryImage').set_input_files(image)
            page.locator('#newMemoryForm button[type=submit]').click()
            expect(page.locator('#memoryTimeline article')).to_have_count(1)
            expect(page.locator('#memoryTimeline h3')).to_have_text('ذكرى الاختبار')
            page.locator('#memoryTitle0').fill('ذكرى معدّلة')
            page.locator('#timelineEditorList').get_by_role('button', name='حفظ التعديل', exact=True).click()
            expect(page.locator('#memoryTimeline h3')).to_have_text('ذكرى معدّلة')
            page.locator('#newMemoryTitle').fill('ذكرى للحذف')
            page.locator('#newMemoryForm button[type=submit]').click()
            expect(page.locator('#memoryTimeline article')).to_have_count(2)
            page.locator('#timelineEditorList fieldset').nth(1).get_by_role('button', name='نقل للأعلى ↑').click()
            expect(page.locator('#memoryTimeline h3').first).to_have_text('ذكرى للحذف')
            page.locator('#timelineEditorList fieldset').first.get_by_role('button', name='حذف الذكرى', exact=True).click()
            expect(page.locator('#memoryTimeline h3')).to_have_text('ذكرى معدّلة')
            page.locator('.letter-editor-row').first.locator('summary').click()
            page.locator('#letterTitle0').fill('إذا احتجتِ اختبارًا')
            page.locator('#letterText0').fill('رسالة مخصصة آمنة <script>وليست شيفرة</script>')
            page.locator('#saveLoveLetters').click()
            expect(page.locator('.open-when-letter')).to_have_count(6)
            for letter in page.locator('.open-when-letter').all():
                if not letter.get_attribute('open'):
                    letter.locator('summary').click()
                expect(letter.locator('p')).to_be_visible()
                require(bool(letter.locator('p').inner_text()), 'Empty letter')
            expect(page.locator('.open-when-letter').first.locator('p')).to_have_text('رسالة مخصصة آمنة <script>وليست شيفرة</script>')
            page.locator('.story-editor-row').first.locator('summary').click()
            page.locator('#storyTitle0').fill('عنوان حكايتنا المخصص')
            page.locator('#storyText0').fill('نص الحكاية الخاص بنا')
            page.locator('#storyMargin0').fill('هامش شخصي سري')
            page.locator('#saveStoryChapters').click()
            page.locator('.page-dot[data-page="0"]').click()
            expect(page.locator('#bookPageTitle')).to_have_text('عنوان حكايتنا المخصص')
            page.locator('#toggleMarginNoteBtn').click()
            expect(page.locator('#marginSecretBox')).to_have_text('هامش شخصي سري')
            page.locator('#personalFinalMessage').fill('رسالتي الأخيرة المخصصة\nأحبكِ في كل يوم 🤍')
            page.locator('#saveFinalMessage').click()
            page.locator('#breakWaxSealBtn').click()
            expect(page.locator('#finalScrollLetter')).to_have_text('رسالتي الأخيرة المخصصة\nأحبكِ في كل يوم 🤍')
            expected_data.update(page.evaluate('GiftExtras.data'))

        check('Timeline create/edit/reorder/delete, six custom letters, story editing and final wax-sealed message', editable_sections)

        def persistent_data():
            page.reload(wait_until='networkidle')
            login()
            require(page.evaluate('GiftExtras.data') == expected_data, 'Personal data changed after reload')
            expect(page.locator('#couponCoffeeBtn')).to_have_attribute('aria-pressed', 'true')
            expect(page.locator('#couponOutingBtn')).to_have_attribute('aria-pressed', 'true')
            expect(page.locator('#couponMovieBtn')).to_have_attribute('aria-pressed', 'false')
            expect(page.locator('[data-gift-mood="happy"]')).to_have_attribute('aria-pressed', 'true')
            expect(page.locator('.little-garden-flower')).to_have_count(1)
            expect(page.locator('#dateGiftCountdown')).to_be_visible()
            expect(page.locator('#memoryTimeline h3')).to_have_text('ذكرى معدّلة')
            page.locator('#dateGiftClear').click()
            expect(page.locator('#dateGiftCountdown')).to_be_hidden()
            require(page.evaluate('GiftExtras.read("datePlan", null)') is None, 'Date clear did not persist')

        check('LocalStorage restoration for images, audio, text, timeline, coupons, mood, garden and date; clear date', persistent_data)

        def canvas_download():
            for index in range(3):
                page.locator(f'[data-cardquote="{index}"]').click()
            with page.expect_download() as event:
                page.locator('#downloadCardBtn').click()
            destination = options.artifacts / 'keepsake.png'
            event.value.save_as(destination)
            image = destination.read_bytes()
            require(image[:8] == b'\x89PNG\r\n\x1a\n', 'Downloaded card is not PNG')
            width, height = struct.unpack('!II', image[16:24])
            require((width, height) == (1080, 1350), f'Unexpected PNG dimensions: {width}×{height}')

        check('Three keepsake designs and actual PNG download with 1080×1350 dimensions', canvas_download)

        def music_controls():
            expect(page.locator('#ytIframe')).to_have_attribute('src', 'about:blank')
            expect(page.locator('#musicToggle')).to_have_attribute('aria-pressed', 'false')
            page.locator('#musicToggle').click()
            expect(page.locator('#ytIframe')).to_have_attribute('src', __import__('re').compile(r'https://www.youtube-nocookie.com/embed/IPuWTXlSrTw\?'))
            expect(page.locator('#musicSeek')).to_be_enabled()
            expect(page.locator('#musicDuration')).to_have_text('3:00')
            page.locator('#musicToggle').click()
            expect(page.locator('#musicToggle')).to_have_attribute('aria-pressed', 'true')
            page.locator('#musicToggle').click()
            expect(page.locator('#musicToggle')).to_have_attribute('aria-pressed', 'false')
            page.locator('#musicSeek').fill('50')
            expect(page.locator('#musicCurrentTime')).to_have_text('0:50')
            page.locator('#musicForward').click()
            expect(page.locator('#musicCurrentTime')).to_have_text('1:00')
            page.locator('#musicBack').click()
            expect(page.locator('#musicCurrentTime')).to_have_text('0:50')
            page.locator('#musicVolume').fill('30')
            page.locator('[data-audiomode="chorus"]').click()
            expect(page.locator('#musicCurrentTime')).to_have_text('0:45')
            expect(page.locator('#musicToggle')).to_have_attribute('aria-pressed', 'true')
            page.locator('#musicToggle').click()
            expect(page.locator('#musicToggle')).to_have_attribute('aria-pressed', 'false')

        check('Lazy YouTube request and play/pause/seek/skip/volume/chorus UI using simulated player protocol', music_controls)

        def standalone():
            export_source = Path(__file__).resolve().parents[1] / 'assets/js/export-source.js'
            require(export_source.is_file(), 'Run python3 tools/build_standalone.py first: export-source.js missing')
            page.locator('#gift-customize').evaluate('(node)=>node.open=true')
            with page.expect_download(timeout=30000) as event:
                page.locator('#downloadPersonalGift').click()
            destination = options.artifacts / 'personal-gift.html'
            event.value.save_as(destination)
            html = destination.read_text()
            require('data-gift-shared="true"' in html, 'Export is not marked shared')
            require('data:font/woff2;base64,' in html, 'Fonts not embedded')
            require('data:image/webp;base64,' in html, 'Artwork not embedded')
            require('data:audio/wav;base64,' in html, 'Voice not embedded')
            fresh = new_context(viewport={'width': 390, 'height': 844})
            offline = fresh.new_page()
            requests = []
            offline.on('request', lambda request: requests.append(request.url))
            # Managed Chromium blocks file:// navigation. A separate loopback
            # origin serves the export as a single document and tests the same
            # self-contained asset contract without relying on file access.
            class QuietHandler(SimpleHTTPRequestHandler):
                def log_message(self, *_):
                    pass
            export_server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(options.artifacts.resolve())))
            threading.Thread(target=export_server.serve_forever, daemon=True).start()
            exported_url = f'http://127.0.0.1:{export_server.server_port}/personal-gift.html'
            offline.goto(exported_url, wait_until='load')
            login(offline)
            require(offline.evaluate('GiftExtras.data') == expected_data, 'Export did not restore exact custom data')
            expect(offline.locator('#memoryTimeline h3')).to_have_text('ذكرى معدّلة')
            offline.locator('.page-dot[data-page="0"]').click()
            expect(offline.locator('#bookPageTitle')).to_have_text('عنوان حكايتنا المخصص')
            expect(offline.locator('#albumFeaturedImage')).to_have_attribute('alt', 'صورة الاختبار <safe>')
            offline.locator('#breakWaxSealBtn').click()
            expect(offline.locator('#finalScrollLetter')).to_have_text('رسالتي الأخيرة المخصصة\nأحبكِ في كل يوم 🤍')
            offline.wait_for_function('document.querySelector("#personalVoiceAudio").readyState >= 2')
            # Force every lazy image to load before checking embedded asset health.
            offline.locator('img').evaluate_all('(nodes)=>nodes.forEach(n=>n.loading="eager")')
            offline.wait_for_function('Array.from(document.images).every(i=>!i.getAttribute("src") || (i.complete && i.naturalWidth>0))')
            network = [url for url in requests if url.startswith(('http:', 'https:')) and url != exported_url]
            local_files = [url for url in requests if url.startswith('file:') and url != destination.resolve().as_uri()]
            require(not network and not local_files, 'Standalone requested external assets: ' + repr(network + local_files))
            offline.screenshot(path=str(options.artifacts / 'standalone-mobile.png'))
            fresh.close()
            export_server.shutdown()
            export_server.server_close()

        check('Personalized standalone HTML download, offline reopening, embedded fonts/artwork/audio/text and zero asset requests', standalone)

        def responsive(width, height):
                mobile = new_context(viewport={'width': width, 'height': height})
                view = mobile.new_page()
                view.goto(options.url, wait_until='networkidle')
                require(view.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'Welcome overflows at {width}')
                view.locator('#beginJourney').click()
                require(view.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'Login overflows at {width}')
                login(view)
                view.screenshot(path=str(options.artifacts / f'home-{width}x{height}.png'))
                sections = view.locator('#galaxyExperience > section').all()
                for section in sections:
                    section.scroll_into_view_if_needed()
                    require(view.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'World overflows at {width}, section {section.get_attribute("id")}')
                view.locator('#gift-customize').evaluate('(node)=>node.open=true')
                view.locator('#gift-customize').scroll_into_view_if_needed()
                require(view.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'Settings overflow at {width}')
                view.locator('#openSideMenu').click()
                expect(view.locator('#closeSideMenu')).to_be_focused()
                require(view.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'Drawer overflows at {width}')
                view.screenshot(path=str(options.artifacts / f'drawer-{width}x{height}.png'))
                view.keyboard.press('Escape')
                expect(view.locator('#openSideMenu')).to_be_focused()
                # Check intrinsic image loading, including those outside the viewport.
                view.locator('img').evaluate_all('(nodes)=>nodes.forEach(n=>n.loading="eager")')
                view.wait_for_function('Array.from(document.images).every(i=>!i.getAttribute("src") || (i.complete && i.naturalWidth>0))')
                require(view.evaluate('document.fonts.check("24px Amiri") && document.fonts.check("16px \\\"IBM Plex Sans Arabic\\\"")'), 'Local Arabic fonts unavailable')
                mobile.close()

        for width, height in [(1440, 900), (1280, 720), (390, 844), (360, 800)]:
            check(f'{width}×{height} layout, drawers, images, fonts and no horizontal scrolling', lambda w=width, h=height: responsive(w, h))

        def remaining_controls():
            page.locator('#smileNoteBtn').click()
            expect(page.locator('#smileNoteText')).to_be_visible()
            page.locator('#hugGiftBtn').click()
            expect(page.locator('#hugGiftText')).to_be_visible()
            before = page.locator('#timeGreetingLabel').inner_text()
            page.locator('#timeGreetingBtn').click()
            require(page.locator('#timeGreetingLabel').inner_text() != before, 'Greeting did not cycle')
            page.locator('#lightAllStarsBtn').click()
            expect(page.locator('.star-hotspot.discovered')).to_have_count(5)
            before = page.locator('#gramophoneStudio').get_attribute('class')
            page.locator('#toggleStudioAuraBtn').click()
            require(page.locator('#gramophoneStudio').get_attribute('class') != before, 'Studio aura did not change')
            for mode in ('full', 'whisper'):
                page.locator(f'[data-audiomode="{mode}"]').click()
                expect(page.locator(f'[data-audiomode="{mode}"]')).to_have_class('mode-pill active')
            for link in page.locator('.dock-link').all():
                href = link.get_attribute('href')
                link.click()
                require(page.evaluate('location.hash') == href, 'Dock navigation failed: ' + str(href))
            page.locator('#sendBurstHeartsBtn').click()
            expect(page.locator('#toastContainer')).to_contain_text('امتلأت سماء المجرّة')
            page.locator('#gift-customize').evaluate('(node)=>node.open=true')
            page.locator('#removeGiftVoice').click()
            expect(page.locator('#playVoiceGift')).to_be_disabled()
            expect(page.locator('#personalVoiceAudio')).not_to_have_attribute('src', __import__('re').compile('.+'))
            page.locator('#giftMemoryEditor button').click()
            expect(page.locator('#memoryGiftGallery figure')).to_have_count(0)

        check('Greeting, kind notes, all stars, studio aura, audio text modes, dock links, hearts and media removal', remaining_controls)

        def storage_failure():
            limited = new_context(viewport={'width': 390, 'height': 844})
            limited.add_init_script("Storage.prototype.setItem=function(){throw new DOMException('Simulated quota','QuotaExceededError')}")
            restricted = limited.new_page()
            restricted.goto(options.url, wait_until='networkidle')
            login(restricted)
            restricted.locator('#gift-customize').evaluate('(node)=>node.open=true')
            restricted.locator('#giftReasonsInput').fill('كلمة تبقى في هذه الزيارة')
            restricted.locator('#saveGiftReasons').click()
            expect(restricted.locator('#giftCustomizeStatus')).to_contain_text('ما قدر يحفظها')
            restricted.locator('#nextLoveReasonBtn').click()
            expect(restricted.locator('#loveReasonText')).to_have_text('كلمة تبقى في هذه الزيارة')
            limited.close()

        check('Storage quota errors preserve usable in-memory edits and show save guidance', storage_failure)
        check('No JavaScript page errors', lambda: require(not page_errors, repr(page_errors)))
        check('No missing local files or HTTP errors', lambda: require(not bad_responses, repr(bad_responses)))
        browser.close()

    report['external_requests_blocked'] = sorted(set(report['external_requests_blocked']))
    report['page_errors'] = page_errors
    report['local_http_errors'] = bad_responses
    report['finished_at'] = dt.datetime.now(dt.timezone.utc).isoformat()
    report['counts'] = {key: len(report[key]) for key in ('passed', 'failed', 'skipped')}
    (options.artifacts / 'report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2))
    print(json.dumps(report['counts']))
    return 1 if report['failed'] else 0


if __name__ == '__main__':
    sys.exit(main())
