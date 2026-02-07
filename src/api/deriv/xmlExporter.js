/**
 * Deriv Bot XML Exporter
 * Converts TradeCraft Arena blocks to Deriv Bot XML format.
 */

import { DERIV_CONFIG } from './config';

/**
 * Export strategy blocks to Deriv Bot XML format
 */
export function exportToDerivBotXML(blocks, strategyName = 'TradeCraft Strategy') {
    const xml = buildXMLDocument(blocks, strategyName);
    return formatXML(xml);
}

/**
 * Build the XML document structure
 */
function buildXMLDocument(blocks, strategyName) {
    const entryBlocks = blocks.filter(b => b.category === 'entry');
    const defenseBlocks = blocks.filter(b => b.category === 'defense');
    const sizingBlocks = blocks.filter(b => b.category === 'sizing');

    // Get stake from sizing block
    const stakePct = sizingBlocks[0]?.params?.percentage || 10;
    const stake = (DERIV_CONFIG.DEFAULTS.STAKE * stakePct / 10).toFixed(2);

    // Get stop/take profit values
    const stopLoss = defenseBlocks.find(b => b.id === 'stop-loss')?.params?.percentage || 2;
    const takeProfit = defenseBlocks.find(b => b.id === 'take-profit')?.params?.percentage || 5;

    return `<?xml version="1.0" encoding="UTF-8"?>
<xml xmlns="https://developers.google.com/blockly/xml">
  <!-- Strategy: ${escapeXML(strategyName)} -->
  <!-- Exported from TradeCraft Arena -->
  
  <block type="trade_definition" id="trade_def">
    <statement name="TRADE_OPTIONS">
      <block type="trade_definition_market" id="market">
        <field name="MARKET_LIST">synthetic_index</field>
        <field name="SUBMARKET_LIST">random_index</field>
        <field name="SYMBOL_LIST">${DERIV_CONFIG.DEFAULTS.SYMBOL}</field>
        <next>
          <block type="trade_definition_tradetype" id="tradetype">
            <field name="TRADETYPE_LIST">callput</field>
            <next>
              <block type="trade_definition_contracttype" id="contracttype">
                <field name="TYPE_LIST">both</field>
                <next>
                  <block type="trade_definition_candleinterval" id="interval">
                    <field name="CANDLEINTERVAL_LIST">60</field>
                    <next>
                      <block type="trade_definition_restartbuysell" id="restart">
                        <field name="TIME_MACHINE_ENABLED">FALSE</field>
                        <next>
                          <block type="trade_definition_restartonerror" id="restartErr">
                            <field name="RESTARTONERROR">TRUE</field>
                          </block>
                        </next>
                      </block>
                    </next>
                  </block>
                </next>
              </block>
            </next>
          </block>
        </next>
      </block>
    </statement>
    <statement name="SUBMARKET">
      <block type="trade_definition_duration">
        <field name="DURATION_TYPE_LIST">t</field>
        <value name="DURATION">
          <shadow type="math_number">
            <field name="NUM">5</field>
          </shadow>
        </value>
      </block>
    </statement>
  </block>
  
  <!-- Purchase Conditions -->
  <block type="before_purchase" id="before_purchase" x="100" y="300">
    <statement name="BEFOREPURCHASE_STACK">
      <block type="purchase" id="purchase">
        <field name="PURCHASE_LIST">CALL</field>
        <value name="AMOUNT">
          <shadow type="math_number">
            <field name="NUM">${stake}</field>
          </shadow>
        </value>
      </block>
    </statement>
  </block>
  
  <!-- Entry Conditions -->
${buildEntryConditionsXML(entryBlocks)}
  
  <!-- During Trade (Risk Management) -->
  <block type="during_purchase" id="during_purchase" x="100" y="600">
    <statement name="DURING_PURCHASE_STACK">
${buildRiskManagementXML(stopLoss, takeProfit)}
    </statement>
  </block>
  
  <!-- After Trade -->
  <block type="after_purchase" id="after_purchase" x="100" y="900">
    <statement name="AFTERPURCHASE_STACK">
      <block type="trade_again" id="trade_again">
        <field name="TRADEOPTIONS">TRUE</field>
      </block>
    </statement>
  </block>
</xml>`;
}

/**
 * Build entry conditions XML based on blocks
 */
function buildEntryConditionsXML(entryBlocks) {
    if (entryBlocks.length === 0) {
        return `  <!-- No entry conditions - using default -->`;
    }

    const conditions = entryBlocks.map(block => {
        switch (block.id) {
            case 'rsi-gate':
                return buildRSIConditionXML(block.params);
            case 'ma-cross':
                return buildMACrossConditionXML(block.params);
            case 'macd-signal':
                return buildMACDConditionXML(block.params);
            default:
                return `  <!-- Unknown block: ${block.id} -->`;
        }
    });

    return conditions.join('\n');
}

/**
 * Build RSI indicator condition
 */
function buildRSIConditionXML(params) {
    const threshold = params.threshold || 30;
    return `  <block type="indicators_rsi" id="rsi_indicator" x="400" y="300">
    <field name="RSI_INPUT_PERIOD">14</field>
    <field name="RSI_INPUT_SOURCE">close</field>
    <!-- Threshold: ${threshold} -->
  </block>`;
}

/**
 * Build MA crossover condition
 */
function buildMACrossConditionXML(params) {
    const fast = params.fast || 9;
    const slow = params.slow || 21;
    return `  <block type="indicators_sma" id="sma_fast" x="400" y="400">
    <field name="SMA_INPUT_PERIOD">${fast}</field>
  </block>
  <block type="indicators_sma" id="sma_slow" x="400" y="500">
    <field name="SMA_INPUT_PERIOD">${slow}</field>
  </block>`;
}

/**
 * Build MACD condition
 */
function buildMACDConditionXML(params) {
    const fast = params.fast || 12;
    const slow = params.slow || 26;
    const signal = params.signal || 9;
    return `  <block type="indicators_macd" id="macd_indicator" x="400" y="300">
    <field name="MACD_FAST_PERIOD">${fast}</field>
    <field name="MACD_SLOW_PERIOD">${slow}</field>
    <field name="MACD_SIGNAL_PERIOD">${signal}</field>
  </block>`;
}

/**
 * Build risk management XML
 */
function buildRiskManagementXML(stopLoss, takeProfit) {
    return `      <block type="controls_if" id="risk_check">
        <mutation else="0"/>
        <value name="IF0">
          <block type="logic_compare">
            <field name="OP">LTE</field>
            <value name="A">
              <block type="read_details">
                <field name="DETAIL_INDEX">4</field>
              </block>
            </value>
            <value name="B">
              <block type="math_number">
                <field name="NUM">-${stopLoss}</field>
              </block>
            </value>
          </block>
        </value>
        <statement name="DO0">
          <block type="sell_at_market" id="stop_loss_sell">
            <field name="SELL_AT_MARKET">TRUE</field>
          </block>
        </statement>
      </block>`;
}

/**
 * Escape XML special characters
 */
function escapeXML(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/**
 * Format XML with proper indentation
 */
function formatXML(xml) {
    // Just return as-is since we build it formatted
    return xml;
}

/**
 * Get XML as downloadable blob (web) or string (native)
 */
export function getXMLBlob(blocks, strategyName) {
    const xml = exportToDerivBotXML(blocks, strategyName);
    return new Blob([xml], { type: 'application/xml' });
}

/**
 * Suggested filename for the exported XML
 */
export function getExportFilename(strategyName) {
    const safeName = strategyName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    return `${safeName}_deriv_bot.xml`;
}

export default {
    exportToDerivBotXML,
    getXMLBlob,
    getExportFilename,
};
