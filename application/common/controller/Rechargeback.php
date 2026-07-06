<?php
/**
 * Create By PhpStrom
 * @Author: BeiTa
 * @Date: 2023/8/24
 * @Time: 17:30
 */

namespace app\common\controller;


use app\admin\model\contract\Pay;
use app\admin\model\user\Balance;
use app\admin\model\user\Money;
use think\Config;
use think\Controller;
use Web3\Web3;
use Exception;
use Web3\Providers\HttpProvider;

/**
 * 项目公共控制器
 * @package app\common\controller
 */
class Rechargeback extends Controller
{

    public function check_recharge() {
        // 获取所有状态为未处理且哈希不为空的订单
        // BSC 区块链网络的节点 URL
        $rpcUrl = 'https://bsc-dataseed1.binance.org:443';
        $pendingOrders = Pay::whereNotNull('hash')->where('hash', '<>', '')
            ->where('status', 1)
            ->select();; // 获取所有状态为未处理的订单
        if(count($pendingOrders)==0){
            return true;
        }
        foreach ($pendingOrders as $order) {
            $transactionHash = $order->hash;
            $userAddress = strtolower($order->from); // 统一转为小写以便比较
            $amount = $order->price;
            $oid = $transactionHash;
            $user_id=$order->uid;
            $type=$order->credittype;
            $ooid=$order->id;
            $toAddress=$order->to;
            try {
                $web3 = new Web3(new HttpProvider($rpcUrl,10));
                // 使用 Web3 对象获取指定交易哈希的交易信息，并传入回调函数处理结果
                $web3->eth->getTransactionByHash($transactionHash, function ($err, $txResult) use ($web3,$transactionHash, $userAddress, $amount, $oid,$user_id,$type,$ooid,$toAddress) {
                    if ($err !== null) {
                        echo '查询交易信息失败: ' . $err->getMessage();
                        return;
                    }
                    // 第二步：获取交易收据（核心：验证交易是否成功执行）
                    $web3->eth->getTransactionReceipt($transactionHash, function ($receiptErr, $receiptResult) use ($txResult, $transactionHash, $userAddress, $amount, $oid, $user_id, $type, $ooid, $toAddress) {
                        if ($receiptErr !== null) {
                            echo '查询交易收据失败: ' . $receiptErr->getMessage();
                            return;
                        }

                        // 1. 检查交易收据是否存在（未上链则为null）
                        if (empty($receiptResult)) {
                            echo '交易未上链（Pending状态）: ' . $transactionHash;
                            return;
                        }

                        // 2. 核心验证：交易执行状态（0x1=成功，0x0=失败）
                        $txStatus = $receiptResult->status;
                        if ($txStatus !== '0x1') {
                            echo '交易执行失败（状态码：' . $txStatus . '）: ' . $transactionHash;
                            return;
                        }
                        $amountHex = substr($txResult->input, 74);
                        $amountWei = hexdec($amountHex); // 将十六进制金额转换为十进制（Wei）
                        $uts = $amountWei / (10 ** 18);
                        $recipient = $this->parseERC20Recipient($txResult->input);
                        if($type=='usdt'){
                            $admin_to=Config::get('site.contract_address');
                            // $admin_to='0xadf03fd89ba23e8e821afbdba04f06d19a12ae74';
                        }else{
                            $admin_to=Config::get('site.my_contract_address');
                        }
                        if (!empty($txResult->from) && strtolower($txResult->from) === $userAddress && $uts == $amount && strtolower($recipient) === strtolower($toAddress) && strtolower($txResult->to) === strtolower($admin_to)) {
                            if(Pay::where('hash', $oid)->where('status',1)->find()){
                                if($type=='usdt'){
                                    Money::change_money($user_id,$amount,Money::RECHARGE,'充值到账');
                                }else{
//                                Balance::change_money($user_id,$amount,Balance::RECHARGE,'充值到账');
                                }
                                Pay::where('hash', $oid)->update(['status' => 2,'updatetime'=>time()]);
                                echo '交易成功，订单ID: ' . $oid;
                            }else{
                                echo '此HASH已完成交易: ' . $oid;
                            }
                        } else {
                            echo '未能在交易收据中找到符合条件的信息: ' . $txResult->to;
                        }
                });
                });
            } catch (Exception $e) {
                echo '发生错误: ' . $e->getMessage();
            }
        }
    }

    /**
     * 解析ERC20转账交易的input数据，提取收款地址
     * ERC20的transfer方法签名: 0xa9059cbb
     * 格式: 0xa9059cbb[收款地址(64位)][金额(64位)]
     */

   public function parseERC20Recipient($input) {
        // 检查是否是ERC20的transfer方法
        $methodSig = substr($input, 0, 10);
        if ($methodSig !== '0xa9059cbb') {
            return null;
        }

        // 提取收款地址（去掉前2位0x，然后取第4-67位，共64位）
        $addressHex = substr($input, 10, 64);
        // 转换为标准地址格式（添加0x前缀）
        return '0x' . substr($addressHex, 24); // 以太坊地址是20字节，即40个十六进制字符
    }
}
