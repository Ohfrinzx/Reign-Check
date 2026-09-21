import type { GameState } from '../../game/types';
import type { ShopItemDef } from '../../game/content/shop';
import { KIND_LABEL, KIND_NOTE, SHOP_MAP } from '../../game/content/shop';
import {
  ADVISOR_CAP, DEAL_CAP, buyLimit, canAfford, capBlockReason, heldDealEntries, isActRoom,
  ownedAdvisorDefs, priceLine, roomIsClosed, shopHeading, shopPrice,
} from '../../game/shop';
import { termsIn } from '../../game/glossary';
import { fill } from '../../game/text';
import { currentMandate } from '../../game/content/mandates';
import { usd } from '../../game/economy';
import { CutControl, FireControl, ManageRow } from './Manage';

/**
 * THE BACK ROOM — the shop, rendered as the day's last document, plus a
 * held-panel sidebar (owner request) showing your advisor and deal slots
 * right there, so choosing to fire/cut something to make room for a new
 * purchase never means leaving the shop to do it.
 *
 * Every offer states its price AND its catch in plain text on the card
 * itself. Nothing required to make the decision is behind a hover
 * (ground rule 11) or below the fold — the "leave" action lives above the offers,
 * inside the fullscreen shop (ground rule 9).
 */
export function ShopScreen({
  s, onBuy, onLeave, onFire, onCut,
}: {
  s: GameState;
  onBuy: (id: string) => void;
  onLeave: () => void;
  onFire: (id: string) => void;
  onCut: (id: string) => void;
}) {
  const stock = s.shopStock.map((id) => SHOP_MAP[id]).filter(Boolean);
  const big = isActRoom(s);
  const head = shopHeading(s);
  const boughtTonight = s.log.filter((l) => l.day === s.day && l.kind === 'purchase');
  const closed = roomIsClosed(s);
  const oneOnly = buyLimit(s) === 1;

  const glossaryTerms = termsIn(
    stock.flatMap((d) => [d.name, d.seller, d.upside, d.downside ?? '', priceLine(s, d)]),
  );

  return (
    <div className="shop-layout">
      <div className="doc-wrap">
        <div className={`shop ${big ? 'big' : ''}`}>
          <div className="shop-head">
            <div className="kicker">
              {big ? 'After the vote' : 'After hours'} &middot; Day {s.day}
            </div>
            <h1>{head.title}</h1>
            <div className="shop-sub">{fill(head.sub, s)}</div>
            <div className="shop-purse">
              {currentMandate(s).priceMult && <span>Mandate discount included. </span>}
              In the account: <b>{usd(s.stats.treasury)}</b>
              <span className="limit">
                {oneOnly
                  ? ' · One thing a night. Choose.'
                  : ' · Tonight you may take as much as you can pay for.'}
              </span>
            </div>
          </div>

          <div className="shop-foot">
            <button className="btn btn-primary" onClick={onLeave}>
              Leave and begin Day {s.day + 1} →
            </button>
            <span className="note">Nothing here is compulsory. Or press Enter.</span>
          </div>

          {stock.length === 0 && s.shopBuysTonight === 0 && (
            <div className="empty">
              Nobody came tonight. Whatever you were going to be offered, you were
              not offered it.
            </div>
          )}
          {stock.length === 0 && s.shopBuysTonight > 0 && oneOnly && (
            <div className="shop-closed">
              The room is done with you. The other two offers go back in the bag
              and you will not see them again tonight.
            </div>
          )}

          <div className="shop-grid">
            {stock.map((def, i) => (
              <Offer key={def.id} s={s} def={def} index={i} onBuy={onBuy} closed={closed} />
            ))}
          </div>

          {boughtTonight.length > 0 && (
            <div className="shop-receipt">
              <div className="kicker">Tonight you took</div>
              {boughtTonight.map((l, i) => (
                <div className="line" key={i}>
                  <span className="n">{l.title}</span>
                  <span className="v">{l.text}</span>
                </div>
              ))}
            </div>
          )}

          {glossaryTerms.length > 0 && (
            <div className="card-glossary">
              {glossaryTerms.map((t) => (
                <span key={t.term}><b>{t.term}</b>: {t.def}</span>
              ))}
            </div>
          )}


        </div>
      </div>

      <HeldPanel s={s} onFire={onFire} onCut={onCut} />
    </div>
  );
}

function Offer({
  s, def, index, onBuy, closed,
}: {
  s: GameState;
  def: ShopItemDef;
  index: number;
  onBuy: (id: string) => void;
  closed: boolean;
}) {
  const price = shopPrice(s, def);
  const capReason = capBlockReason(s, def);
  const short = Math.max(0, price - s.stats.treasury);
  const affordable = canAfford(s, def) && !closed && !capReason;

  return (
    <div className={`offer ${def.rarity} ${affordable ? '' : 'broke'}`}>
      <div className="offer-top">
        <span className="k">{KIND_LABEL[def.kind]}</span>
        {def.rarity === 'rare' && <span className="rare-tag">Rare · no catch</span>}
        {def.rarity === 'uncommon' && <span className="unc-tag">Uncommon</span>}
        {def.durationDays && <span className="dur-tag">Lasts {def.durationDays} days</span>}
        <span className="num">{index + 1}</span>
      </div>
      <h2>{def.name}</h2>
      <div className="seller">{fill(def.seller, s)}</div>

      <div className="line up">
        <span className="tag">What you get</span>
        {fill(def.upside, s)}
      </div>
      {def.downside ? (
        <div className="line down">
          <span className="tag">The catch</span>
          {fill(def.downside, s)}
        </div>
      ) : (
        <div className="line none">
          <span className="tag">The catch</span>
          None. That is why it is expensive.
        </div>
      )}

      <div className="offer-foot">
        <div className="price">
          <span className={price < 0 ? 'pays' : ''}>{priceLine(s, def)}</span>
          <span className="kn">{KIND_NOTE[def.kind]}</span>
        </div>
        <button
          className="btn btn-primary"
          disabled={!affordable}
          onClick={() => onBuy(def.id)}
        >
          {price < 0 ? 'Take it' : 'Buy'}
        </button>
      </div>
      {!affordable && capReason && (
        <div className="locked">✕ {capReason}</div>
      )}
      {!affordable && !capReason && !closed && (
        <div className="locked">✕ You are {usd(short)} short.</div>
      )}
    </div>
  );
}

/**
 * The held-panel — your advisor and deal slots, live, right next to the
 * shop's offers. Fire an advisor or cut a deal here to free a slot without
 * leaving the room; the offer you were eyeing re-enables the moment you do.
 * Rows are compact (name + status/timer + button) — the full upside/downside
 * text is one click away in "Advisors & Deals" from the main game.
 */
function HeldPanel({
  s, onFire, onCut,
}: {
  s: GameState;
  onFire: (id: string) => void;
  onCut: (id: string) => void;
}) {
  const advisors = ownedAdvisorDefs(s);
  const deals = heldDealEntries(s);
  // We are already confined to the shop phase here, so there is no "mid-card"
  // state to guard against the way Pocket/ManageScreen do for the main game.
  const canAct = true;

  return (
    <aside className="held-panel">
      <div className="panel held-section">
        <h3>Advisors <span>{advisors.length}/{ADVISOR_CAP}</span></h3>
        {advisors.length === 0 && <div className="empty">None hired yet.</div>}
        {advisors.map((def) => (
          <ManageRow key={def.id} def={def} s={s} compact>
            <FireControl def={def} s={s} canAct={canAct} onFire={onFire} />
          </ManageRow>
        ))}
      </div>

      <div className="panel held-section">
        <h3>Deals <span>{deals.length}/{DEAL_CAP}</span></h3>
        {deals.length === 0 && <div className="empty">None arranged yet.</div>}
        {deals.map(({ def, status, daysLeft }) => (
          <ManageRow key={def.id} def={def} s={s} compact>
            <span className={`manage-timer ${status}`}>
              {status === 'active' ? `${daysLeft}d left` : 'Ongoing'}
            </span>
            <CutControl def={def} s={s} canAct={canAct} onCut={onCut} />
          </ManageRow>
        ))}
      </div>
    </aside>
  );
}

/** Advisors, policies and unspent favours — shown in the right rail all run. */
export function Pocket({
  s, onUseFavour,
}: {
  s: GameState;
  onUseFavour: (id: string) => void;
}) {
  const owned = s.owned.map((id) => SHOP_MAP[id]).filter(Boolean);
  const favours = s.heldFavours.map((id) => SHOP_MAP[id]).filter(Boolean);
  if (!owned.length && !favours.length) return null;

  const canSpend = s.phase === 'briefing' || s.phase === 'stage' || s.phase === 'night';

  return (
    <div className="panel">
      <h3>Back Room {(owned.length + favours.length) > 0 && <span>{owned.length + favours.length}</span>}</h3>

      {owned.map((def) => (
        <div className="kept" key={def.id}>
          <div className="n">{def.name}</div>
          <div className="d">{def.upside}</div>
          {def.downside && <div className="c">{def.downside}</div>}
        </div>
      ))}

      {favours.map((def) => (
        <div className="kept fav" key={def.id}>
          <div className="n">{def.name}</div>
          <div className="d">{def.use?.label ?? def.upside}</div>
          <button
            className="btn"
            disabled={!canSpend}
            onClick={() => onUseFavour(def.id)}
            title={canSpend ? 'Spend this favour now' : 'Finish the current item first'}
          >
            Spend it
          </button>
        </div>
      ))}
    </div>
  );
}
